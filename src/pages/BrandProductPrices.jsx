import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, orderBy, query, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Plus, Trash2 } from 'lucide-react'

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

export default function BrandProductPrices() {
  const { id, pid } = useParams()
  const [product, setProduct] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ price: '', date: today, note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const [prodSnap, histSnap] = await Promise.all([
      getDoc(doc(db, 'brands', id, 'products', pid)),
      getDocs(query(collection(db, 'brands', id, 'products', pid, 'priceHistory'), orderBy('date', 'desc')))
    ])
    if (prodSnap.exists()) setProduct({ id: prodSnap.id, ...prodSnap.data() })
    setHistory(histSnap.docs.map(d => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => { load() }, [id, pid])

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.price) { setError('請輸入金額'); return }
    setSaving(true)
    try {
      const docRef = await addDoc(collection(db, 'brands', id, 'products', pid, 'priceHistory'), {
        price: Number(form.price),
        date: form.date,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      })
      setHistory(prev => [{ id: docRef.id, price: Number(form.price), date: form.date, note: form.note.trim() }, ...prev])
      setForm({ price: '', date: today, note: '' })
    } catch {
      setError('儲存失敗，請再試一次')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(hid) {
    await deleteDoc(doc(db, 'brands', id, 'products', pid, 'priceHistory', hid))
    setHistory(prev => prev.filter(h => h.id !== hid))
  }

  if (!product) return <div style={{ padding: 16, fontFamily: 'Nunito', color: '#B5A3A3' }}>載入中...</div>

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={`${product.name} 價格紀錄`} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Add Form */}
        <div style={{ background: '#FFFFFF', borderRadius: 22, padding: 16, boxShadow: '0 2px 8px rgba(58,46,46,0.05)' }}>
          <p style={{ ...labelStyle, marginBottom: 12 }}>新增價格紀錄</p>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono', fontSize: 13, color: '#B5A3A3' }}>$</span>
                <input
                  value={form.price}
                  onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setError('') }}
                  type="number"
                  min="0"
                  placeholder="金額"
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
              type="submit"
              disabled={saving}
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

        {/* History List */}
        {history.length === 0 ? (
          <p style={{ textAlign: 'center', fontFamily: 'Nunito', fontSize: 13, color: '#B5A3A3', padding: '24px 0' }}>還沒有價格紀錄</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map(h => (
              <div key={h.id} style={{
                background: '#FFFFFF', borderRadius: 18, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: '0 2px 8px rgba(58,46,46,0.04)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: 16, color: '#3A2E2E' }}>${h.price.toLocaleString()}</p>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', letterSpacing: '0.08em', marginTop: 3 }}>{h.date}{h.note ? ` · ${h.note}` : ''}</p>
                </div>
                <button onClick={() => handleDelete(h.id)} style={{ background: 'none', border: 'none', color: '#D8C8C8', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
