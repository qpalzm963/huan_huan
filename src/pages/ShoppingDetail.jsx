import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, orderBy, query, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { Plus, Trash2, ExternalLink } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const today = new Date().toISOString().split('T')[0]

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

      // update latestPrice / previousPrice on the shopping item
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

    // recalculate latestPrice / previousPrice
    const newLatest = remaining[0]?.price ?? null
    const newPrevious = remaining[1]?.price ?? null
    await updateDoc(doc(db, 'shopping', id), {
      latestPrice: newLatest,
      previousPrice: newPrevious,
    })
    setItem(prev => ({ ...prev, latestPrice: newLatest, previousPrice: newPrevious }))
    setHistory(remaining)
  }

  if (!item) return <div className="p-4 text-[#7BAEC8]">載入中...</div>

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="商品詳細" />
      <div className="p-4 space-y-4">

        {/* 商品資訊 */}
        <Card className="p-4 space-y-3">
          {item.imageUrl && (
            <img src={item.imageUrl} alt={item.name} className="w-full aspect-video object-cover rounded-xl" />
          )}
          <div>
            <p className="text-lg font-bold text-[#1A4F6E]">{item.name}</p>
            <p className="text-xs text-[#7BAEC8] mt-0.5">{CATEGORIES[item.category] || item.category}</p>
          </div>
          {item.productUrl && (
            <a
              href={item.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-[#4AAFDC] font-semibold"
            >
              <ExternalLink size={14} /> 前往商品頁面
            </a>
          )}
          {item.note && <p className="text-sm text-[#7BAEC8]">{item.note}</p>}
        </Card>

        {/* 新增價格紀錄 */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide mb-3">新增價格紀錄</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7BAEC8]">$</span>
                <input
                  value={form.price}
                  onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setError('') }}
                  type="number" min="0" placeholder="金額"
                  className="w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl pl-7 pr-3 py-2.5 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
                />
              </div>
              <input
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                type="date"
                className="bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-3 py-2.5 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]"
              />
            </div>
            <input
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="備註（選填，例：蝦皮購入）"
              className="w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-2.5 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit" disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-[#4AAFDC] text-white py-2.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60"
            >
              <Plus size={15} /> 新增紀錄
            </button>
          </form>
        </Card>

        {/* 價格歷史 */}
        {history.length === 0 ? (
          <p className="text-center text-sm text-[#B0D8EE] py-4">還沒有價格紀錄</p>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => {
              const prev = history[i + 1]
              const trend = prev
                ? h.price > prev.price ? 'up'
                : h.price < prev.price ? 'down'
                : 'same'
                : null
              return (
                <Card key={h.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-bold text-[#4AAFDC] font-['Caveat']">${h.price.toLocaleString()}</p>
                      {i === 0 && <span className="text-xs bg-[#E0F3FB] text-[#4AAFDC] px-1.5 py-0.5 rounded-full font-semibold">最新</span>}
                      {trend === 'up' && <span className="text-xs text-red-400 font-semibold">↑ +${(h.price - prev.price).toLocaleString()}</span>}
                      {trend === 'down' && <span className="text-xs text-green-500 font-semibold">↓ -${(prev.price - h.price).toLocaleString()}</span>}
                    </div>
                    <p className="text-xs text-[#7BAEC8]">{h.date}{h.note ? ` · ${h.note}` : ''}</p>
                  </div>
                  <button onClick={() => handleDelete(h.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer">
                    <Trash2 size={15} />
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
