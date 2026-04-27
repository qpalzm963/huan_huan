import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'

const TYPES = [
  { value: 'weight', label: '體重' },
  { value: 'vaccine', label: '疫苗' },
  { value: 'deworming_internal', label: '體內驅蟲' },
  { value: 'deworming_external', label: '體外驅蟲' },
  { value: 'litter_large', label: '大貓砂盆' },
  { value: 'litter_small', label: '小貓砂盆' },
  { value: 'visit', label: '看診' },
  { value: 'anomaly', label: '異常狀態' },
]

const SEVERITY_OPTIONS = [
  { value: 'mild', label: '輕微', color: '#F59E0B' },
  { value: 'moderate', label: '中等', color: '#F97316' },
  { value: 'severe', label: '嚴重', color: '#EF4444' },
]

const MAX_PHOTOS = 3

export default function HealthNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const fileRef = useRef(null)

  const [type, setType] = useState('weight')
  const isPreventive = ['vaccine', 'deworming_internal', 'deworming_external'].includes(type)
  const isLitter = ['litter_large', 'litter_small'].includes(type)
  const [form, setForm] = useState({
    date: today, weight: '', name: '', nextDate: '',
    clinic: '', reason: '', symptom: '', severity: '', note: ''
  })
  const [anomalyPhotos, setAnomalyPhotos] = useState([]) // [{file, preview}]
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleAnomalyPhoto(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const remaining = MAX_PHOTOS - anomalyPhotos.length
    const toProcess = files.slice(0, remaining)
    const newPhotos = await Promise.all(toProcess.map(async f => {
      const compressed = await compressImage(f, 1920, 0.85)
      return { file: compressed, preview: URL.createObjectURL(compressed) }
    }))
    setAnomalyPhotos(prev => [...prev, ...newPhotos])
    e.target.value = ''
  }

  function removeAnomalyPhoto(idx) {
    setAnomalyPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  async function uploadAnomalyPhotos() {
    const results = []
    for (let i = 0; i < anomalyPhotos.length; i++) {
      const { file } = anomalyPhotos[i]
      const path = `health-anomaly/${Date.now()}_${i}.webp`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file)
      await new Promise((resolve, reject) => {
        task.on('state_changed',
          snap => setUploadProgress(Math.round(
            ((i + snap.bytesTransferred / snap.totalBytes) / anomalyPhotos.length) * 100
          )),
          reject,
          resolve
        )
      })
      const url = await getDownloadURL(storageRef)
      results.push({ url, path })
    }
    return results
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (type === 'weight' && (!form.weight || isNaN(form.weight))) { setError('請輸入體重'); return }
    if (isPreventive && !form.name.trim()) { setError('請輸入品項名稱'); return }
    if (type === 'visit' && !form.reason.trim()) { setError('請輸入看診原因'); return }
    if (type === 'anomaly' && !form.symptom.trim()) { setError('請描述異常症狀'); return }
    setSaving(true)
    try {
      const data = { type, date: form.date, note: form.note.trim(), createdAt: Timestamp.now() }
      if (type === 'weight') data.weight = Number(form.weight)
      if (isPreventive) { data.name = form.name.trim(); data.nextDate = form.nextDate }
      if (isLitter) data.nextDate = form.nextDate
      if (type === 'visit') { data.clinic = form.clinic.trim(); data.reason = form.reason.trim() }
      if (type === 'anomaly') {
        data.symptom = form.symptom.trim()
        data.severity = form.severity
        data.photos = anomalyPhotos.length > 0 ? await uploadAnomalyPhotos() : []
      }
      await addDoc(collection(db, 'health'), data)
      navigate('/health')
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  const isUploading = saving && type === 'anomaly' && anomalyPhotos.length > 0
  const btnLabel = isUploading ? `上傳中 ${uploadProgress}%` : saving ? '儲存中...' : '儲存紀錄'

  return (
    <div className="flex flex-col min-h-full" style={{background:'#F5F0EB'}}>
      <PageHeader title="新增健康紀錄" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">

        {/* 類型 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">類型</label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {TYPES.map(t => (
              <button key={t.value} type="button" onClick={() => setType(t.value)}
                className={`py-2 px-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${type === t.value ? 'bg-[#B0D8EE] text-[#1A4F6E]' : 'bg-white border border-[#B0D8EE] text-[#7BAEC8]'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 日期 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">日期</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        {/* 體重 */}
        {type === 'weight' && (
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">體重 (kg)</label>
            <input type="number" inputMode="decimal" step="0.01" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="4.20"
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        )}

        {/* 預防保健 */}
        {isPreventive && (<>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">品項名稱</label>
            <input value={form.name} onChange={e => set('name', e.target.value)}
              placeholder={type === 'vaccine' ? '例：三合一疫苗' : type === 'deworming_internal' ? '例：Revolution' : '例：Frontline'}
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">下次到期日（選填）</label>
            <input type="date" value={form.nextDate} onChange={e => set('nextDate', e.target.value)}
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        </>)}

        {/* 貓砂更換 */}
        {isLitter && (
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">下次更換日（選填）</label>
            <input type="date" value={form.nextDate} onChange={e => set('nextDate', e.target.value)}
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        )}

        {/* 看診 */}
        {type === 'visit' && (<>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">診所名稱（選填）</label>
            <input value={form.clinic} onChange={e => set('clinic', e.target.value)} placeholder="例：XX 動物醫院"
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">看診原因</label>
            <input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="例：年度健康檢查"
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        </>)}

        {/* 異常狀態 */}
        {type === 'anomaly' && (<>
          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">異常症狀描述</label>
            <textarea value={form.symptom} onChange={e => set('symptom', e.target.value)}
              placeholder="例：食慾不振、嘔吐、精神不佳..." rows={3}
              className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">嚴重程度（選填）</label>
            <div className="flex gap-2 mt-2">
              {SEVERITY_OPTIONS.map(s => (
                <button key={s.value} type="button"
                  onClick={() => set('severity', form.severity === s.value ? '' : s.value)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer border"
                  style={form.severity === s.value
                    ? { background: s.color, color: '#fff', borderColor: s.color }
                    : { background: 'white', color: s.color, borderColor: s.color + '88' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">
              照片紀錄（選填，最多 {MAX_PHOTOS} 張）
            </label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {anomalyPhotos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-white border border-[#B0D8EE]">
                  <img src={p.preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removeAnomalyPhoto(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none font-bold">
                    ×
                  </button>
                </div>
              ))}
              {anomalyPhotos.length < MAX_PHOTOS && (
                <div
                  onClick={() => !saving && fileRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#B0D8EE] bg-white flex flex-col items-center justify-center cursor-pointer active:opacity-70 text-[#7BAEC8]">
                  <ImagePlus size={22} />
                  <span className="text-xs mt-1 font-semibold">新增</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAnomalyPhoto} />
          </div>
        </>)}

        {/* 備註 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="任何補充說明..." rows={2}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {btnLabel}
        </button>
      </form>
    </div>
  )
}
