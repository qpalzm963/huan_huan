import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'

const CATEGORIES = [
  { value: 'food', label: '食品' },
  { value: 'medical', label: '醫療' },
  { value: 'supplies', label: '用品' },
  { value: 'other', label: '其他' },
]

export default function ShoppingNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', category: 'food', estimatedPrice: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入品項名稱'); return }
    setSaving(true)
    try {
      await addDoc(collection(db, 'shopping'), {
        name: form.name.trim(),
        category: form.category,
        estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : null,
        note: form.note.trim(),
        done: false,
        createdAt: Timestamp.now(),
      })
      navigate('/shopping')
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增購物項目" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">分類</label>
          <div className="flex gap-2 mt-2">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => set('category', cat.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  form.category === cat.value ? 'bg-[#B0D8EE] text-[#1A4F6E]' : 'bg-white border border-[#B0D8EE] text-[#7BAEC8]'
                }`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">品項名稱</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：皇家 老貓配方"
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">預估金額（選填）</label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7BAEC8] text-sm">$</span>
            <input type="number" inputMode="numeric" value={form.estimatedPrice} onChange={e => set('estimatedPrice', e.target.value)} placeholder="0" min="0"
              className="w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl pl-8 pr-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="在哪裡買？為什麼想買..." rows={2}
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? '儲存中...' : '加入清單'}
        </button>
      </form>
    </div>
  )
}
