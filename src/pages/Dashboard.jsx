import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import AvatarCropModal from '../components/AvatarCropModal'
import { getProfile, saveAvatar } from '../utils/profileSettings'

const EXPENSE_CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = {
  food:     '#FFD4B0',
  medical:  '#C8EBD9',
  supplies: '#E0CFF2',
  other:    '#C8E0F2',
}

const QUICK_ACTIONS = [
  { label: '記帳', sub: 'SPEND',  to: '/expenses/new', bg: '#FFE4A0', icon: 'spend' },
  { label: '飲食', sub: 'DIET',   to: '/diet/new',     bg: '#FFD4B0', icon: 'diet'  },
  { label: '健康', sub: 'CARE',   to: '/health/new',   bg: '#C8EBD9', icon: 'health'},
  { label: '照片', sub: 'PHOTO',  to: '/photos/new',   bg: '#C8E0F2', icon: 'photo' },
]

// Sticker icons (chunky, color-block, white inner)
function StickerIcon({ k, size = 36 }) {
  const s = { fill: 'none', stroke: '#3D2A2A', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const inner = (
    {
      spend:  <><rect x="4" y="7" width="16" height="12" rx="2.5" fill="#fff" {...s} /><path d="M4 9 v-1 a2 2 0 0 1 2 -2 H15" {...s} /><circle cx="16" cy="13" r="1.6" fill="#3D2A2A" /></>,
      diet:   <><ellipse cx="12" cy="14" rx="7.5" ry="5" fill="#fff" {...s} /><ellipse cx="12" cy="13.5" rx="4" ry="2.5" fill="#FFD4B0" stroke="none" /><circle cx="9" cy="9" r="1.4" fill="#3D2A2A" /><circle cx="15" cy="9" r="1.4" fill="#3D2A2A" /></>,
      health: <><path d="M12 20 s-7-4-7-9 a3.7 3.7 0 0 1 7-1.5 a3.7 3.7 0 0 1 7 1.5 c0 5-7 9-7 9 z" fill="#fff" {...s} /><path d="M7 12 H9.5 L10.5 10 L12.5 14 L13.5 12 H17" {...s} /></>,
      photo:  <><rect x="3.5" y="6.5" width="17" height="13" rx="2.5" fill="#fff" {...s} /><path d="M9 6.5 L10.5 4 H13.5 L15 6.5" {...s} /><circle cx="12" cy="13" r="3" fill="#C8E0F2" {...s} /></>,
    }[k]
  )
  return <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24">{inner}</svg>
}

function Sparkle({ x, y, size = 12, color = '#F5C04D', rotate = 0 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, transform: `rotate(${rotate}deg)`, pointerEvents: 'none' }}>
      <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" fill={color} />
    </svg>
  )
}
function Heart({ x, y, size = 12, color = '#FF92AE' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, pointerEvents: 'none' }}>
      <path d="M12 21 s-7-4-7-9 a3.7 3.7 0 0 1 7-1.5 a3.7 3.7 0 0 1 7 1.5 c0 5-7 9-7 9 z" fill={color} />
    </svg>
  )
}
function Squiggle({ x, y, w = 60, color = '#FF92AE' }) {
  return (
    <svg width={w} height="8" viewBox="0 0 60 8" style={{ position: 'absolute', left: x, top: y }}>
      <path d="M0 4 Q 7.5 0 15 4 T 30 4 T 45 4 T 60 4" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [recentExpenses, setRecentExpenses] = useState([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [memoryPhotos, setMemoryPhotos] = useState([])
  const [avatarBase64, setAvatarBase64] = useState(null)
  const [cropFile, setCropFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      try {
        const expQ = query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(5))
        const snap = await getDocs(expQ)
        setRecentExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))

        const now = new Date()
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const allSnap = await getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc')))
        const total = allSnap.docs.map(d => d.data()).filter(d => d.date >= monthStart).reduce((s, d) => s + (d.amount || 0), 0)
        setMonthTotal(total)

        const today = new Date()
        const lastYear = today.getFullYear() - 1
        const dates = []
        for (let d = -3; d <= 3; d++) {
          const dt = new Date(lastYear, today.getMonth(), today.getDate() + d)
          dates.push(dt.toISOString().slice(0, 10))
        }
        const photosSnap = await getDocs(collection(db, 'photos'))
        const memories = photosSnap.docs.map(d => d.data()).filter(p => dates.includes(p.date)).slice(0, 3)
        setMemoryPhotos(memories)

        const profile = await getProfile()
        setAvatarBase64(profile.avatarBase64)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  function openPicker() { fileInputRef.current?.click() }
  function onFileChosen(e) { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = '' }
  async function handleConfirm(b) { if (!b) { setCropFile(null); return } try { await saveAvatar(b); setAvatarBase64(b) } catch (err) { alert('儲存失敗'); return } setCropFile(null) }
  async function handleReset() { try { await saveAvatar(null); setAvatarBase64(null) } catch { alert('還原失敗'); return } setCropFile(null) }

  const now = new Date()
  const monthLabel = `${now.getMonth() + 1}月`
  const dateLabel = `${now.getMonth() + 1}/${now.getDate()}`
  const wd = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()]

  return (
    <div style={{ padding: '4px 14px 16px' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 14px', position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600, lineHeight: 1 }}>{wd} · {dateLabel}</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 24, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 4, position: 'relative' }}>
            早安， 嬛嬛
            <Squiggle x={86} y={30} w={60} color="#FF92AE" />
          </div>
        </div>
        <div onClick={openPicker} style={{
          width: 50, height: 50, borderRadius: '50%',
          background: '#FFC8D6',
          border: '3px solid #FFFFFF',
          boxShadow: '0 3px 0 rgba(61,42,42,0.1), 0 6px 14px rgba(255,146,174,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#3D2A2A', fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600,
          cursor: 'pointer', overflow: 'hidden',
        }}>
          {avatarBase64 ? <img src={avatarBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '嬛'}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChosen} style={{ display: 'none' }} />
      </div>

      {/* Hero card */}
      <div style={{
        background: '#FFC8D6', borderRadius: 24, padding: 20,
        border: '2px solid #3D2A2A',
        boxShadow: '0 4px 0 #3D2A2A',
        position: 'relative',
      }}>
        <Sparkle x="calc(100% - 36px)" y={12} size={14} color="#F5C04D" rotate={20} />
        <Heart x="calc(100% - 56px)" y={36} size={12} color="#fff" />
        <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 600, color: '#3D2A2A' }}>this month ♡</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 2 }}>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 48, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.03em', color: '#3D2A2A' }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 14, marginRight: 4, fontWeight: 500 }}>NT$</span>
            {loading ? '—' : monthTotal.toLocaleString()}
          </div>
        </div>
        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#3D2A2A', opacity: 0.7, marginTop: 8 }}>
          {monthLabel} · 食 · 醫 · 用 · 其他
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4, marginBottom: 8 }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#FF92AE', fontWeight: 600 }}>quick log ♡</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => navigate(a.to)} style={{
              background: '#FFFFFF',
              border: '2px solid #3D2A2A',
              borderRadius: 18,
              padding: '12px 4px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: '0 3px 0 #3D2A2A', cursor: 'pointer',
            }}>
              <div style={{
                width: 38, height: 38, background: a.bg, borderRadius: 12,
                border: '2px solid #fff',
                boxShadow: '0 2px 0 rgba(61,42,42,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <StickerIcon k={a.icon} size={38} />
              </div>
              <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 600, color: '#3D2A2A' }}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Memory */}
      {memoryPhotos.length > 0 && (
        <div onClick={() => navigate('/photos')} style={{
          marginTop: 16, background: '#FFE4A0', borderRadius: 22, padding: 14,
          border: '2px solid #3D2A2A', boxShadow: '0 3px 0 #3D2A2A',
          cursor: 'pointer', position: 'relative',
        }}>
          <Heart x="calc(100% - 28px)" y={10} size={12} color="#FF92AE" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#3D2A2A', fontWeight: 600 }}>one year ago ✿</div>
              <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A' }}>那天的陽光剛好</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {memoryPhotos.map((p, i) => (
              <div key={i} style={{ flex: 1, aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#F0E4E0', border: '2px solid #3D2A2A' }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div style={{ marginTop: 16, paddingLeft: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#FF92AE', fontWeight: 600 }}>recent ♡</span>
          <button onClick={() => navigate('/expenses')} style={{ fontFamily: "'Fredoka', system-ui", fontSize: 11, fontWeight: 600, color: '#FFA877', background: 'none', border: 'none', cursor: 'pointer' }}>
            SEE ALL →
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 50, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 14, marginBottom: 6, opacity: 0.5 }} />)
          ) : recentExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#C4A8A8', fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 600 }}>還沒有花費紀錄 ♡</div>
          ) : (
            recentExpenses.map((it, i) => (
              <div key={it.id} onClick={() => navigate('/expenses')} style={{
                display: 'grid', gridTemplateColumns: '8px 38px 1fr auto', gap: 8, alignItems: 'center',
                background: '#FFFFFF', borderRadius: 14, padding: '10px 12px', marginBottom: 6,
                border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
                cursor: 'pointer',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: 999, background: CAT_COLORS[it.category], border: '1.5px solid #3D2A2A' }} />
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#7A5C5C' }}>{it.date?.slice(5)}</div>
                <div>
                  <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 14, fontWeight: 600, color: '#3D2A2A' }}>{it.name}</div>
                  <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: '#C4A8A8' }}>{EXPENSE_CATEGORIES[it.category]}</div>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 12, fontWeight: 500, color: '#3D2A2A' }}>${it.amount?.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {cropFile && <AvatarCropModal imageFile={cropFile} onConfirm={handleConfirm} onCancel={() => setCropFile(null)} onReset={handleReset} />}
    </div>
  )
}
