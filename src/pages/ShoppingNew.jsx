import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { compressImage } from '../utils/compressImage'
import { ImagePlus } from 'lucide-react'

const CATEGORIES = [
  { value: 'food', label: '食品' },
  { value: 'medical', label: '醫療' },
  { value: 'supplies', label: '用品' },
  { value: 'other', label: '其他' },
]

export default function ShoppingNew() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState({ name: '', category: 'food', estimatedPrice: '', note: '', productUrl: '' })
  const [imageMode, setImageMode] = useState('upload') // 'upload' | 'url'
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    const compressed = await compressImage(f, 800, 0.85)
    setImageFile(compressed)
    setImagePreview(URL.createObjectURL(compressed))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入品項名稱'); return }
    setSaving(true)
    try {
      let imageUrl = null
      let imagePath = null

      if (imageMode === 'upload' && imageFile) {
        imagePath = `shopping/${Date.now()}.webp`
        const storageRef = ref(storage, imagePath)
        const task = uploadBytesResumable(storageRef, imageFile)
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject, resolve
          )
        })
        imageUrl = await getDownloadURL(storageRef)
      } else if (imageMode === 'url' && imageUrlInput.trim()) {
        imageUrl = imageUrlInput.trim()
      }

      await addDoc(collection(db, 'shopping'), {
        name: form.name.trim(),
        category: form.category,
        estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : null,
        note: form.note.trim(),
        productUrl: form.productUrl.trim() || null,
        imageUrl,
        imagePath,
        latestPrice: null,
        previousPrice: null,
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
    <div className="flex flex-col min-h-full" style={{background:'#F5F0EB'}}>
      <PageHeader title="新增購物項目" />
      <form onSubmit={handleSubmit} className="p-4 space-y-4 flex-1">

        {/* 分類 */}
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

        {/* 圖片 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">圖片（選填）</label>
          <div className="flex gap-2 mt-2 mb-3">
            {['upload', 'url'].map(mode => (
              <button key={mode} type="button" onClick={() => { setImageMode(mode); setImageFile(null); setImagePreview(null); setImageUrlInput('') }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  imageMode === mode ? 'bg-[#B0D8EE] text-[#1A4F6E]' : 'bg-white border border-[#B0D8EE] text-[#7BAEC8]'
                }`}>
                {mode === 'upload' ? '上傳圖片' : '貼網址'}
              </button>
            ))}
          </div>

          {imageMode === 'upload' ? (
            <div
              onClick={() => !saving && fileRef.current.click()}
              className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-[#B0D8EE] bg-white flex items-center justify-center overflow-hidden cursor-pointer active:opacity-80"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-[#7BAEC8]">
                  <ImagePlus size={28} />
                  <p className="text-xs font-semibold">點擊選擇圖片</p>
                </div>
              )}
              {saving && imageFile && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <p className="text-white text-sm font-bold">{progress}%</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
          ) : (
            <div className="space-y-2">
              <input
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]"
              />
              {imageUrlInput && (
                <img src={imageUrlInput} alt="preview" className="w-full aspect-video object-cover rounded-xl" onError={e => e.target.style.display = 'none'} />
              )}
            </div>
          )}
        </div>

        {/* 品項名稱 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">品項名稱</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：皇家 老貓配方"
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        {/* 商品網址 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">商品網址（選填）</label>
          <input value={form.productUrl} onChange={e => set('productUrl', e.target.value)} placeholder="https://..."
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
        </div>

        {/* 預估金額 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">預估金額（選填）</label>
          <div className="relative mt-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7BAEC8] text-sm">$</span>
            <input type="number" inputMode="numeric" value={form.estimatedPrice} onChange={e => set('estimatedPrice', e.target.value)} placeholder="0" min="0"
              className="w-full bg-white border border-[#B0D8EE] rounded-xl pl-8 pr-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC]" />
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="在哪裡買？為什麼想買..." rows={2}
            className="mt-1 w-full bg-white border border-[#B0D8EE] rounded-xl px-4 py-3 text-sm text-[#1A4F6E] placeholder-[#B0D8EE] focus:outline-none focus:border-[#4AAFDC] resize-none" />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-[#4AAFDC] text-white py-3.5 rounded-xl font-semibold text-sm cursor-pointer disabled:opacity-60">
          {saving ? `儲存中 ${imageFile ? progress + '%' : '...'}` : '加入清單'}
        </button>
      </form>
    </div>
  )
}
