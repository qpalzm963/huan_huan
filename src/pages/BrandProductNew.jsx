import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Star, ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'
import { STAR_FILL, STAR_EMPTY } from './Brands'

const CATEGORIES = [
  { value: 'food', label: '食品', color: 'oklch(0.78 0.06 25)' },
  { value: 'snack', label: '零食', color: 'oklch(0.82 0.07 55)' },
  { value: 'litter', label: '貓砂', color: 'oklch(0.78 0.05 145)' },
  { value: 'supplies', label: '用品', color: 'oklch(0.75 0.06 290)' },
  { value: 'health', label: '保健品', color: 'oklch(0.82 0.07 95)' },
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

export default function BrandProductNew() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({ name: '', category: 'food', rating: 0, note: '', price: '' })
  const [progress, setProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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
      let url = null
      let path = null

      if (file) {
        path = `products/${id}/${Date.now()}.webp`
        const storageRef = ref(storage, path)
        const task = uploadBytesResumable(storageRef, file)
        await new Promise((resolve, reject) => {
          task.on('state_changed',
            snap => setProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
            reject,
            resolve
          )
        })
        url = await getDownloadURL(storageRef)
      }

      await addDoc(collection(db, 'brands', id, 'products'), {
        name: form.name.trim(),
        category: form.category,
        rating: form.rating,
        note: form.note.trim(),
        ...(form.price !== '' && { price: Number(form.price) }),
        ...(url && { url, path }),
        createdAt: Timestamp.now(),
      })
      navigate(`/brands/${id}`)
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增產品" />
      <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>

        {/* 產品圖片 */}
        <div>
          <label style={labelStyle}>產品圖片（選填）</label>
          <div
            onClick={() => !saving && fileRef.current.click()}
            style={{
              position: 'relative', marginTop: 8, width: '100%', height: 160,
              borderRadius: 18, border: '2px dashed #E8DDD3', background: '#FFFFFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', cursor: 'pointer',
            }}
          >
            {preview ? (
              <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#B5A3A3' }}>
                <ImagePlus size={28} />
                <p style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: 600 }}>點擊上傳包裝照</p>
              </div>
            )}
            {saving && file && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(58,46,46,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontFamily: 'JetBrains Mono', fontSize: 18, fontWeight: 600, color: '#FBF6F1' }}>{progress}%</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>分類</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => set('category', cat.value)}
                style={{
                  padding: '8px 14px', borderRadius: 999,
                  fontFamily: 'Nunito', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: 'none',
                  ...(form.category === cat.value
                    ? { background: cat.color + '2A', color: cat.color }
                    : { background: '#FFFFFF', color: '#6E5A5A', boxShadow: '0 2px 6px rgba(58,46,46,0.05)' }),
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>產品名稱</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="例：室內成貓 2kg"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'} />
        </div>

        <div>
          <label style={labelStyle}>評分（選填）</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => set('rating', i + 1)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} aria-label={`${i + 1} 星`}>
                <Star size={28}
                  style={{ fill: i < form.rating ? STAR_FILL : 'none', color: i < form.rating ? STAR_FILL : STAR_EMPTY }} />
              </button>
            ))}
            {form.rating > 0 && (
              <button type="button" onClick={() => set('rating', 0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito', fontSize: 12, color: '#B5A3A3' }}>
                清除
              </button>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>單價（選填）</label>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'JetBrains Mono', fontSize: 14, color: '#B5A3A3' }}>$</span>
            <input
              value={form.price}
              onChange={e => set('price', e.target.value)}
              type="number"
              min="0"
              placeholder="0"
              style={{ ...inputStyle, marginTop: 0, paddingLeft: 32 }}
              onFocus={e => e.target.style.borderColor = '#3A2E2E'}
              onBlur={e => e.target.style.borderColor = '#E8DDD3'}
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>備註（選填）</label>
          <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="嬛嬛的反應如何？" rows={3}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'} />
        </div>

        {error && <p style={{ fontFamily: 'Nunito', fontSize: 13, color: 'oklch(0.65 0.18 25)' }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ ...submitStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? `儲存中${file ? ` ${progress}%` : '...'}` : '儲存產品'}
        </button>
      </form>
    </div>
  )
}
