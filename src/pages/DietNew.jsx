import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'

export default function DietNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ date: today, morning: '', morningAmount: '', evening: '', eveningAmount: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.morning.trim() && !form.evening.trim()) { setError('請至少填入早餐或晚餐'); return }
    setSaving(true)
    try {
      await addDoc(collection(db, 'diet'), {
        date: form.date,
        morning: form.morning.trim(),
        morningAmount: form.morningAmount ? Number(form.morningAmount) : null,
        evening: form.evening.trim(),
        eveningAmount: form.eveningAmount ? Number(form.eveningAmount) : null,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      })
      navigate('/diet')
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  const inputClass = "w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增飲食紀錄" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">日期</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)} className={`mt-1 ${inputClass}`} />
        </div>

        <div className="bg-white rounded-2xl border border-[#B0D8EE] p-4 space-y-3">
          <p className="text-xs font-semibold text-[#4AAFDC] uppercase tracking-wide">早餐</p>
          <input value={form.morning} onChange={e => set('morning', e.target.value)} placeholder="品牌與品項，例：皇家 室內成貓" className={inputClass} />
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" value={form.morningAmount} onChange={e => set('morningAmount', e.target.value)} placeholder="份量" className={`flex-1 ${inputClass}`} />
            <span className="text-sm text-[#7BAEC8]">g</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#B0D8EE] p-4 space-y-3">
          <p className="text-xs font-semibold text-[#3A7EA0] uppercase tracking-wide">晚餐</p>
          <input value={form.evening} onChange={e => set('evening', e.target.value)} placeholder="品牌與品項，例：Seeds 聖萊西" className={inputClass} />
          <div className="flex items-center gap-2">
            <input type="number" inputMode="numeric" value={form.eveningAmount} onChange={e => set('eveningAmount', e.target.value)} placeholder="份量" className={`flex-1 ${inputClass}`} />
            <span className="text-sm text-[#7BAEC8]">g</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="食慾如何？有沒有剩餘..." rows={2}
            className={`mt-1 ${inputClass} resize-none`} />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? '儲存中...' : '儲存紀錄'}
        </button>
      </form>
    </div>
  )
}
