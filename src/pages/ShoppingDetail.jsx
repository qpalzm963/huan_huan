import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, orderBy, query, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Plus, Trash2, ExternalLink } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const today = new Date().toISOString().split('T')[0]

const labelStyle = {
  fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em',
  color: '#B5A3A3', textTransform: 'uppercase',
}
const inputStyle = {
  width: '100%', background: '#FFFFFF', border: '1px solid #E8DDD3',
  borderRadius: 12, padding: '10px 14px',
  fontFamily: 'Nunito', fontSize: 14, color: '#3A2E2E', outline: 'none',
}
const cardStyle = {
  background: '#FFFFFF', borderRadius: 22, padding: 16,
  boxShadow: '0 2px 8px rgba(58,46,46,0.05)',
}

export default function ShoppingDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ price: '', date: today, note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [itemSnap, histSnap] = await Promise.all([
      getDoc(doc(db, 'shopping', id)),
      getDocs(query(collection(db, 'shopping', id, 'priceHistory'), orderBy('date', 'desc')))
    ])
    if (itemSnap.exists()) setItem({ id: itemSnap.id, ...itemSnap.data() })
    setHistory(histSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { load() }, [id])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.price) { setError('請輸入金額'); return }
    setSaving(true)
    try {
      const newPrice = Number(form.price)
      const docRef = await addDoc(collection(db, 'shopping', id, 'priceHistory'), {
        price: newPrice,
        date: form.date,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      })

      const prevLatest = item.latestPrice ?? null
      await updateDoc(doc(db, 'shopping', id), {
        latestPrice: newPrice,
        previousPrice: prevLatest,
      })
      setItem(prev => ({ ...prev, latestPrice: newPrice, previousPrice: prevLatest }))

      setHistory(prev => [{ id: docRef.id, price: newPrice, date: form.date, note: form.note.trim() }, ...prev])
      setForm({ price: '', date: today, note: '' })
    } catch {
      setError('儲存失敗，請再試一次')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(hid) {
    const remaining = history.filter(h => h.id !== hid)
    await deleteDoc(doc(db, 'shopping', id, 'priceHistory', hid))

    const newLatest = remaining[0]?.price ?? null
    const newPrevious = remaining[1]?.price ?? null
    await updateDoc(doc(db, 'shopping', id), {
      latestPrice: newLatest,
      previousPrice: newPrevious,
    })
    setItem(prev => ({ ...prev, latestPrice: newLatest, previousPrice: newPrevious }))
    setHistory(remaining)
  }

  if (!item) return <div style={{ padding: 16, fontFamily: 'Nunito', color: '#B5A3A3' }}>載入中...</div>

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="商品詳細" />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 商品資訊 */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.name}
              style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 14 }} />
          )}
          <div>
            <p style={{ fontFamily: 'Quicksand', fontSize: 18, fontWeight: 500, color: '#3A2E2E' }}>{item.name}</p>
            <p style={{ fontFamily: 'Nunito', fontSize: 12, color: '#B5A3A3', marginTop: 2 }}>
              {CATEGORIES[item.category] || item.category}
            </p>
          </div>
          {item.productUrl && (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'Nunito', fontSize: 13, fontWeight: 600,
                color: '#3A2E2E', textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} /> 前往商品頁面
            </a>
          )}
          {item.note && (
            <p style={{ fontFamily: 'Nunito', fontSize: 13, color: '#6E5A5A', lineHeight: 1.5 }}>{item.note}</p>
          )}
        </div>

        {/* 新增價格紀錄 */}
        <div style={cardStyle}>
          <p style={{ ...labelStyle, marginBottom: 12 }}>新增價格紀錄</p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono', fontSize: 13, color: '#B5A3A3' }}>$</span>
                <input
                  value={form.price}
                  onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setError('') }}
                  type="number" min="0" placeholder="金額"
                  style={{ ...inputStyle, paddingLeft: 28 }}
                  onFocus={e => e.target.style.borderColor = '#3A2E2E'}
                  onBlur={e => e.target.style.borderColor = '#E8DDD3'}
                />
              </div>
              <input
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                type="date"
                style={{ ...inputStyle, width: 'auto' }}
                onFocus={e => e.target.style.borderColor = '#3A2E2E'}
                onBlur={e => e.target.style.borderColor = '#E8DDD3'}
              />
            </div>
            <input
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="備註（選填，例：蝦皮購入）"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#3A2E2E'}
              onBlur={e => e.target.style.borderColor = '#E8DDD3'}
            />
            {error && <p style={{ fontFamily: 'Nunito', fontSize: 12, color: 'oklch(0.65 0.18 25)' }}>{error}</p>}
            <button
              type="submit" disabled={saving}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#3A2E2E', color: '#FBF6F1', border: 'none',
                padding: '12px', borderRadius: 999,
                fontFamily: 'Nunito', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Plus size={15} /> 新增紀錄
            </button>
          </form>
        </div>

        {/* 價格歷史 */}
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', fontFamily: 'Nunito', fontSize: 13, color: '#B5A3A3', padding: '16px 0' }}>
            還沒有價格紀錄
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => {
              const prev = history[i + 1]
              const trend = prev
                ? h.price > prev.price ? 'up'
                : h.price < prev.price ? 'down'
                : 'same'
                : null
              return (
                <div key={h.id} style={{
                  background: '#FFFFFF', borderRadius: 18, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  boxShadow: '0 2px 8px rgba(58,46,46,0.04)',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: '#3A2E2E' }}>${h.price.toLocaleString()}</p>
                      {i === 0 && (
                        <span style={{
                          fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.1em',
                          background: 'oklch(0.78 0.06 25 / 0.18)', color: 'oklch(0.55 0.08 25)',
                          padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase',
                        }}>最新</span>
                      )}
                      {trend === 'up' && (
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'oklch(0.65 0.18 25)' }}>
                          ↑ +${(h.price - prev.price).toLocaleString()}
                        </span>
                      )}
                      {trend === 'down' && (
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: 'oklch(0.55 0.12 145)' }}>
                          ↓ -${(prev.price - h.price).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', letterSpacing: '0.08em', marginTop: 4 }}>
                      {h.date}{h.note ? ` · ${h.note}` : ''}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(h.id)}
                    style={{ background: 'none', border: 'none', color: '#D8C8C8', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
