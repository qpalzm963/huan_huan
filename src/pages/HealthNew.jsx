import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'

const TYPES = [
  { value: 'weight', label: '體重' },
  { value: 'vaccine', label: '疫苗' },
  { value: 'deworming_internal', label: '體內驅蟲' },
  { value: 'deworming_external', label: '體外驅蟲' },
  { value: 'visit', label: '看診' },
]

export default function HealthNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [type, setType] = useState('weight')
  const isPreventive = ['vaccine', 'deworming_internal', 'deworming_external'].includes(type)
  const [form, setForm] = useState({ date: today, weight: '', name: '', nextDate: '', clinic: '', reason: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (type === 'weight' && (!form.weight || isNaN(form.weight))) { setError('請輸入體重'); return }
    if (isPreventive && !form.name.trim()) { setError('請輸入品項名稱'); return }
    if (type === 'visit' && !form.reason.trim()) { setError('請輸入看診原因'); return }
    setSaving(true)
    try {
      const data = { type, date: form.date, note: form.note.trim(), createdAt: Timestamp.now() }
      if (type === 'weight') data.weight = Number(form.weight)
      if (isPreventive) { data.name = form.name.trim(); data.nextDate = form.nextDate }
      if (type === 'visit') { data.clinic = form.clinic.trim(); data.reason = form.reason.trim() }
      await addDoc(collection(db, 'health'), data)
      navigate('/health')
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增健康紀錄" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
        {/* Type */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">類型</label>
          <div className="flex gap-2 mt-2">
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${type === t.value ? 'bg-[#B0D8EE] text-[#1A4F6E]' : 'bg-white border border-[#B0D8EE] text-[#7BAEC8]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">日期</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        {type === 'weight' && (
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">體重 (kg)</label>
            <input type="number" inputMode="decimal" step="0.01" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="4.20"
              className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        )}

        {isPreventive && (<>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">品項名稱</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder={type === 'vaccine' ? '例：三合一疫苗' : type === 'deworming_internal' ? '例：Revolution' : '例：Frontline'}
              className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">下次到期日（選填）</label>
            <input type="date" value={form.nextDate} onChange={e => set('nextDate', e.target.value)}
              className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        </>)}

        {type === 'visit' && (<>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">診所名稱（選填）</label>
            <input value={form.clinic} onChange={e => set('clinic', e.target.value)} placeholder="例：XX 動物醫院"
              className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">看診原因</label>
            <input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="例：年度健康檢查"
              className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        </>)}

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="任何補充說明..." rows={2}
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
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
