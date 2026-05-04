import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { compressImage } from '../utils/compressImage'
import { ImagePlus } from 'lucide-react'

const CATEGORIES = [
  { value: 'food', label: '食品', color: 'oklch(0.78 0.06 25)' },
  { value: 'medical', label: '醫療', color: 'oklch(0.78 0.06 25)' },
  { value: 'supplies', label: '用品', color: 'oklch(0.78 0.05 75)' },
  { value: 'other', label: '其他', color: '#B5A3A3' },
]

const labelStyle = {
  fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em',
  color: '#B5A3A3', textTransform: 'uppercase', display: 'block',
}
const inputStyle = {
  width: '100%', background: '#FFFFFF', border: '1px solid #E8DDD3',
  borderRadius: 14, padding: '12px 16px', marginTop: 6,
  fontFamily: 'Nunito', fontSize: 14, color: '#3A2E2E', outline: 'none',
}
const submitStyle = {
  width: '100%', background: '#3A2E2E', color: '#FBF6F1', border: 'none',
  padding: '14px', borderRadius: 999,
  fontFamily: 'Nunito', fontWeight: 600, fontSize: 14, cursor: 'pointer',
}

export default function ShoppingNew() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState({ name: '', category: 'food', estimatedPrice: '', note: '', productUrl: '' })
  const [imageMode, setImageMode] = useState('upload')
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
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增購物項目" />
      <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

        {/* 分類 */}
        <div>
          <label style={labelStyle}>分類</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button" onClick={() => set('category', cat.value)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  fontFamily: 'Nunito', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: 'none',
                  ...(form.category === cat.value
                    ? { background: cat.color + '2A', color: cat.color }
                    : { background: '#FFFFFF', color: '#6E5A5A', boxShadow: '0 2px 6px rgba(58,46,46,0.05)' }),
                }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 圖片 */}
        <div>
          <label style={labelStyle}>圖片（選填）</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 10 }}>
            {['upload', 'url'].map(mode => (
              <button key={mode} type="button"
                onClick={() => { setImageMode(mode); setImageFile(null); setImagePreview(null); setImageUrlInput('') }}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10,
                  fontFamily: 'Nunito', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: 'none',
                  ...(imageMode === mode
                    ? { background: '#3A2E2E', color: '#FBF6F1' }
                    : { background: '#FFFFFF', color: '#6E5A5A', boxShadow: '0 2px 6px rgba(58,46,46,0.05)' }),
                }}>
                {mode === 'upload' ? '上傳圖片' : '貼網址'}
              </button>
            ))}
          </div>

          {imageMode === 'upload' ? (
            <div
              onClick={() => !saving && fileRef.current.click()}
              style={{
                position: 'relative', width: '100%', aspectRatio: '16 / 9',
                borderRadius: 18, border: '2px dashed #E8DDD3', background: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', cursor: 'pointer',
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#B5A3A3' }}>
                  <ImagePlus size={28} />
                  <p style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 600 }}>點擊選擇圖片</p>
                </div>
              )}
              {saving && imageFile && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(58,46,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ fontFamily: 'JetBrains Mono', fontSize: 16, fontWeight: 600, color: '#FBF6F1' }}>{progress}%</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{ ...inputStyle, marginTop: 0 }}
                onFocus={e => e.target.style.borderColor = '#3A2E2E'}
                onBlur={e => e.target.style.borderColor = '#E8DDD3'}
              />
              {imageUrlInput && (
                <img src={imageUrlInput} alt="preview"
                  style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', borderRadius: 14 }}
                  onError={e => e.target.style.display = 'none'} />
              )}
            </div>
          )}
        </div>

        {/* 品項名稱 */}
        <div>
          <label style={labelStyle}>品項名稱</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：皇家 老貓配方"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'} />
        </div>

        {/* 商品網址 */}
        <div>
          <label style={labelStyle}>商品網址（選填）</label>
          <input value={form.productUrl} onChange={e => set('productUrl', e.target.value)} placeholder="https://..."
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'} />
        </div>

        {/* 預估金額 */}
        <div>
          <label style={labelStyle}>預估金額（選填）</label>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono', fontSize: 14, color: '#B5A3A3' }}>$</span>
            <input type="number" inputMode="numeric"
              value={form.estimatedPrice} onChange={e => set('estimatedPrice', e.target.value)}
              placeholder="0" min="0"
              style={{ ...inputStyle, marginTop: 0, paddingLeft: 32 }}
              onFocus={e => e.target.style.borderColor = '#3A2E2E'}
              onBlur={e => e.target.style.borderColor = '#E8DDD3'} />
          </div>
        </div>

        {/* 備註 */}
        <div>
          <label style={labelStyle}>備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="在哪裡買？為什麼想買..." rows={2}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'} />
        </div>

        {error && <p style={{ fontFamily: 'Nunito', fontSize: 13, color: 'oklch(0.65 0.18 25)' }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ ...submitStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? `儲存中 ${imageFile ? progress + '%' : '...'}` : '加入清單'}
        </button>
      </form>
    </div>
  )
}
