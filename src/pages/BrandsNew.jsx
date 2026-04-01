import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Star } from 'lucide-react'

export default function BrandsNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', rating: 0, note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入品牌名稱'); return }
    setSaving(true)
    try {
      await addDoc(collection(db, 'brands'), {
        name: form.name.trim(),
        rating: form.rating,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      })
      navigate('/brands')
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{background:'#F5F0EB'}}>
      <PageHeader title="新增品牌" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">品牌名稱</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="例：皇家 Royal Canin"
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">評分</label>
          <div className="flex items-center gap-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => set('rating', i + 1)} className="cursor-pointer" aria-label={`${i + 1} 星`}>
                <Star size={28} className={i < form.rating ? 'fill-[#4AAFDC] text-[#4AAFDC]' : 'text-[#B0D8EE]'} />
              </button>
            ))}
            {form.rating > 0 && (
              <button type="button" onClick={() => set('rating', 0)} className="text-xs text-[#7BAEC8] cursor-pointer">清除</button>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="嬛嬛喜不喜歡？有什麼特別之處..."
            rows={3}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? '儲存中...' : '儲存品牌'}
        </button>
      </form>
    </div>
  )
}
