import { useState, useRef } from 'react'
import exifr from 'exifr'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'

export default function PhotosNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const fileRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({ title: '', date: today, note: '' })
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dateSource, setDateSource] = useState('manual') // 'exif' | 'manual'

  const PRESET_TAGS = ['玩耍', '睡覺', '吃飯', '日常', '可愛']

  function addTag(t) {
    const v = t.trim()
    if (v && !tags.includes(v)) setTags(prev => [...prev, v])
    setTagInput('')
  }

  function removeTag(t) { setTags(prev => prev.filter(x => x !== t)) }

  function togglePreset(t) {
    if (tags.includes(t)) removeTag(t)
    else addTag(t)
  }

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return

    // 嘗試讀取 EXIF 拍攝日期（在壓縮前，讀原始檔案）
    try {
      const exif = await exifr.parse(f, ['DateTimeOriginal', 'DateTime'])
      const taken = exif?.DateTimeOriginal ?? exif?.DateTime
      if (taken instanceof Date && !isNaN(taken)) {
        const iso = taken.toISOString().split('T')[0]
        set('date', iso)
        setDateSource('exif')
      } else {
        setDateSource('manual')
      }
    } catch {
      setDateSource('manual')
    }

    const compressed = await compressImage(f, 1920, 0.85)
    setFile(compressed)
    setPreview(URL.createObjectURL(compressed))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('請選擇一張照片'); return }
    setSaving(true)
    try {
      const path = `photos/${Date.now()}.webp`
      const storageRef = ref(storage, path)
      const task = uploadBytesResumable(storageRef, file)

      await new Promise((resolve, reject) => {
        task.on('state_changed',
          snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          resolve
        )
      })

      const url = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'photos'), {
        title: form.title.trim(),
        date: form.date,
        note: form.note.trim(),
        tags,
        url,
        path,
        createdAt: Timestamp.now(),
      })
      navigate('/photos')
    } catch {
      setError('上傳失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{background:'#F5F0EB'}}>
      <PageHeader title="新增照片" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">

        {/* 照片選擇 */}
        <div
          onClick={() => !saving && fileRef.current.click()}
          className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-[#B0D8EE] bg-white flex items-center justify-center overflow-hidden cursor-pointer active:opacity-80"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#7BAEC8]">
              <ImagePlus size={36} />
              <p className="text-sm font-semibold">點擊選擇照片</p>
            </div>
          )}
          {saving && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-white text-center">
                <p className="text-2xl font-bold font-['Caveat']">{progress}%</p>
                <p className="text-xs mt-1">上傳中...</p>
              </div>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">標題（選填）</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="例：曬太陽的嬛嬛"
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide flex items-center gap-2">
            日期
            {dateSource === 'exif' && (
              <span className="normal-case tracking-normal font-medium text-[10px] bg-[#E8F4FC] text-[#4AAFDC] px-2 py-0.5 rounded-full">
                📷 自動填入
              </span>
            )}
          </label>
          <input type="date" value={form.date} onChange={e => { set('date', e.target.value); setDateSource('manual') }}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="任何補充說明..." rows={2}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
        </div>

        {/* 標籤 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">標籤（選填）</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRESET_TAGS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => togglePreset(t)}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-colors"
                style={tags.includes(t)
                  ? { background: '#1A4F6E', color: '#fff', borderColor: '#1A4F6E' }
                  : { background: 'white', color: '#7BAEC8', borderColor: '#B0D8EE' }}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 min-h-[28px]">
            {tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
              <span key={t} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F4FC] text-[#1A4F6E] border border-[#B0D8EE]">
                {t}
                <button type="button" onClick={() => removeTag(t)} className="text-[#7BAEC8] hover:text-[#1A4F6E] leading-none">×</button>
              </span>
            ))}
          </div>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) } }}
            onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
            placeholder="輸入自訂標籤後按 Enter"
            className="mt-2 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-2.5 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? `上傳中 ${progress}%` : '儲存照片'}
        </button>
      </form>
    </div>
  )
}
