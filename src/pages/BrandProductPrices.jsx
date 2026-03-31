import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, orderBy, query, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { Plus, Trash2 } from 'lucide-react'

const today = new Date().toISOString().split('T')[0]

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

  if (!product) return <div className="p-4 text-[#7BAEC8]">載入中...</div>

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={`${product.name} 價格紀錄`} />
      <div className="p-4 space-y-4">

        {/* Add Form */}
        <Card className="p-4">
          <p className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide mb-3">新增價格紀錄</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#7BAEC8]">$</span>
                <input
                  value={form.price}
                  onChange={e => { setForm(f => ({ ...f, price: e.target.value })); setError('') }}
                  type="number"
                  min="0"
                  placeholder="金額"
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
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-1.5 bg-[#4AAFDC] text-white py-2.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60"
            >
              <Plus size={15} /> 新增紀錄
            </button>
          </form>
        </Card>

        {/* History List */}
        {history.length === 0 ? (
          <p className="text-center text-sm text-[#B0D8EE] py-6">還沒有價格紀錄</p>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <Card key={h.id} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-[#4AAFDC] font-['Caveat']">${h.price.toLocaleString()}</p>
                  <p className="text-xs text-[#7BAEC8]">{h.date}{h.note ? ` · ${h.note}` : ''}</p>
                </div>
                <button onClick={() => handleDelete(h.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer">
                  <Trash2 size={15} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
