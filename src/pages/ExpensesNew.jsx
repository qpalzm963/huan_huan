import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'

const CATEGORIES = [
  { value: 'food', label: '食品' },
  { value: 'medical', label: '醫療' },
  { value: 'supplies', label: '用品' },
  { value: 'other', label: '其他' },
]

export default function ExpensesNew() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = location.state || {}
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ name: prefill.name || '', amount: prefill.amount || '', category: prefill.category || 'food', date: today, note: '' })
  const [photo, setPhoto] = useState(null) // {file, preview}
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file, 1920, 0.85)
    setPhoto({ file: compressed, preview: URL.createObjectURL(compressed) })
    e.target.value = ''
  }

  async function uploadPhoto() {
    if (!photo) return null
    const path = `expenses/${Date.now()}.webp`
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, photo.file)
    await new Promise((resolve, reject) => {
      task.on('state_changed',
        snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
        reject,
        resolve
      )
    })
    const url = await getDownloadURL(ref(storage, path))
    return { url, path }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入品項名稱'); return }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { setError('請輸入有效金額'); return }
    setSaving(true)
    try {
      const photoData = await uploadPhoto()
      const data = {
        name: form.name.trim(),
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      }
      if (photoData) data.photo = photoData
      await addDoc(collection(db, 'expenses'), data)
      navigate('/expenses')
    } catch (e) {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{background:'#F5F0EB'}}>
      <PageHeader title="新增花費" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">
        {/* Category Tabs */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">分類</label>
          <div className="flex gap-2 mt-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('category', cat.value)}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                  form.category === cat.value
                    ? 'bg-[#B0D8EE] text-[#1A4F6E]'
                    : 'bg-white border border-[#B0D8EE] text-[#7BAEC8]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">品項名稱</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="例：皇家 室內成貓 2kg"
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">金額</label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7BAEC8] text-sm">$</span>
            <input
              type="number"
              inputMode="numeric"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-white border border-[#B0D8EE] rounded-xl pl-8 pr-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
            />
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">日期</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set('date', e.target.value)}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] focus:outline-none focus:border-[#4AAFDC]"
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="任何補充說明..."
            rows={2}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none"
          />
        </div>

        {/* Photo */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">照片（選填）</label>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          {photo ? (
            <div className="relative mt-2 w-24 h-24">
              <img src={photo.preview} alt="" className="w-24 h-24 rounded-xl object-cover border border-[#B0D8EE]" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#1A4F6E] text-white rounded-full text-xs flex items-center justify-center cursor-pointer"
              >×</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 flex items-center gap-2 w-full border-2 border-dashed border-[#B0D8EE] rounded-xl py-4 px-4 text-[#9BBDD0] text-sm cursor-pointer"
            >
              <ImagePlus size={18} />
              <span>點擊新增照片</span>
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60"
        >
          {saving ? (photo && uploadProgress < 100 ? `上傳中 ${uploadProgress}%` : '儲存中...') : '儲存紀錄'}
        </button>
      </form>
    </div>
  )
}
