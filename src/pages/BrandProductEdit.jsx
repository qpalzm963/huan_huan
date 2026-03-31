import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Star, ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'

const CATEGORIES = [
  { value: 'food', label: '食品', color: '#4AAFDC' },
  { value: 'snack', label: '零食', color: '#F97316' },
  { value: 'litter', label: '貓砂', color: '#34D399' },
  { value: 'supplies', label: '用品', color: '#A78BFA' },
  { value: 'health', label: '保健品', color: '#F59E0B' },
]

export default function BrandProductEdit() {
  const { id, pid } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState(null)
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getDoc(doc(db, 'brands', id, 'products', pid)).then(snap => {
      if (snap.exists()) {
        const d = snap.data()
        setForm({ name: d.name || '', category: d.category || 'food', rating: d.rating || 0, note: d.note || '' })
        if (d.url) setPreview(d.url)
      }
    })
  }, [id, pid])

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    const blob = await compressImage(f)
    setFile(blob)
    setPreview(URL.createObjectURL(blob))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入產品名稱'); return }
    setSaving(true)
    try {
      const updates = {
        name: form.name.trim(),
        category: form.category,
        rating: form.rating,
        note: form.note.trim(),
      }

      if (file) {
        const storageRef = ref(storage, `products/${id}/${pid}.jpg`)
        const task = uploadBytesResumable(storageRef, file)
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject, resolve
          )
        })
        updates.url = await getDownloadURL(storageRef)
        updates.path = `products/${id}/${pid}.jpg`
      }

      await updateDoc(doc(db, 'brands', id, 'products', pid), updates)
      navigate(`/brands/${id}`)
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  if (!form) return <div className="p-4 text-[#7BAEC8]">載入中...</div>

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="編輯產品" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">產品圖片（選填）</label>
          <div
            onClick={() => !saving && fileRef.current.click()}
            className="relative mt-2 w-full h-40 rounded-2xl border-2 border-dashed border-[#B0D8EE] bg-[#F2F9FC] flex items-center justify-center overflow-hidden cursor-pointer active:opacity-80"
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#7BAEC8]">
                <ImagePlus size={28} />
                <p className="text-xs font-semibold">點擊更換圖片</p>
              </div>
            )}
            {saving && file && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <p className="text-white text-lg font-bold font-['Caveat']">{progress}%</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">分類</label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => set('category', cat.value)}
                className="px-3 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                style={form.category === cat.value
                  ? { background: cat.color + '33', color: cat.color, border: `1.5px solid ${cat.color}` }
                  : { background: 'white', color: '#7BAEC8', border: '1.5px solid #B0D8EE' }
                }>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">產品名稱</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：室內成貓 2kg"
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">評分（選填）</label>
          <div className="flex items-center gap-2 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => set('rating', i + 1)} className="cursor-pointer">
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
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="嬛嬛的反應如何？" rows={3}
            className="mt-1 w-full bg-[#F2F9FC] border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? `儲存中${file ? ` ${progress}%` : '...'}` : '儲存變更'}
        </button>
      </form>
    </div>
  )
}
