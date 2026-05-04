import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Star } from 'lucide-react'
import { STAR_FILL, STAR_EMPTY } from './Brands'

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

export default function BrandsNew() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', rating: 0, note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('請輸入品牌名稱'); return }
    setSaving(true)
    try {
      await addDoc(collection(db, 'brands'), {
        name: form.name.trim(),
        rating: form.rating,
        note: form.note.trim(),
        createdAt: Timestamp.now(),
      })
      navigate('/brands')
    } catch {
      setError('儲存失敗，請再試一次')
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="新增品牌" />
      <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <div>
          <label style={labelStyle}>品牌名稱</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="例：皇家 Royal Canin"
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'}
          />
        </div>

        <div>
          <label style={labelStyle}>評分</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => set('rating', i + 1)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                aria-label={`${i + 1} 星`}>
                <Star size={28}
                  style={{ fill: i < form.rating ? STAR_FILL : 'none', color: i < form.rating ? STAR_FILL : STAR_EMPTY }}
                />
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
          <label style={labelStyle}>備註（選填）</label>
          <textarea
            value={form.note}
            onChange={e => set('note', e.target.value)}
            placeholder="嬛嬛喜不喜歡？有什麼特別之處..."
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
            onFocus={e => e.target.style.borderColor = '#3A2E2E'}
            onBlur={e => e.target.style.borderColor = '#E8DDD3'}
          />
        </div>

        {error && <p style={{ fontFamily: 'Nunito', fontSize: 13, color: 'oklch(0.65 0.18 25)' }}>{error}</p>}

        <button type="submit" disabled={saving} style={{ ...submitStyle, opacity: saving ? 0.6 : 1 }}>
          {saving ? '儲存中...' : '儲存品牌'}
        </button>
      </form>
    </div>
  )
}
