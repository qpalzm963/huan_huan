import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { ImagePlus } from 'lucide-react'

export default function PhotosNew() {
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ title: '', date: today, note: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef()

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) { setError('請選擇一張照片'); return }
    setSaving(true)
    try {
      const storagePath = `photos/${Date.now()}_${file.name}`
      const storageRef = ref(storage, storagePath)
      const uploadTask = uploadBytesResumable(storageRef, file)

      await new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          resolve
        )
      })

      const url = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'photos'), {
        url,
        storagePath,
        title: form.title.trim(),
        date: form.date,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      })
      navigate('/photos')
    } catch {
      setError('上傳失敗，請再試一次')
      setSaving(false)
      setProgress(0)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增照片" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
        {/* Photo Picker */}
        <div
          onClick={() => !saving && fileRef.current?.click()}
          className={`relative w-full aspect-video bg-[#F2F9FC] border-2 border-dashed border-[#B0D8EE] rounded-2xl flex items-center justify-center overflow-hidden ${!saving ? 'cursor-pointer' : ''}`}
        >
          {preview ? (
            <img src={preview} alt="預覽" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#7BAEC8]">
              <ImagePlus size={32} />
              <p className="text-sm font-medium">點擊選擇照片</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {saving && progress < 100 && (
          <div className="w-full bg-[#B0D8EE] rounded-full h-2">
            <div className="bg-[#4AAFDC] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">標題（選填）</label>
          <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="給這張照片一個名字"
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">日期</label>
          <input type="date" value={form.date} onChange={e => set('date', e.target.value)}
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="記錄這個瞬間..." rows={2}
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? `上傳中 ${progress}%...` : '儲存照片'}
        </button>
      </form>
    </div>
  )
}
