import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import AvatarCropModal from '../components/AvatarCropModal'
import { getProfile, saveAvatar } from '../utils/profileSettings'

const EXPENSE_CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = {
  food: 'oklch(0.88 0.05 15)',
  medical: 'oklch(0.78 0.06 25)',
  supplies: 'oklch(0.78 0.05 75)',
  other: '#B5A3A3',
}

const QUICK_ACTIONS = [
  { label: '記帳', sub: 'Spend', to: '/expenses/new', primary: true },
  { label: '飲食', sub: 'Diet',  to: '/diet/new' },
  { label: '健康', sub: 'Care',  to: '/health/new' },
  { label: '照片', sub: 'Photo', to: '/photos/new' },
]

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
  const dateLabel = `${now.getMonth() + 1} / ${now.getDate()}`
  const wd = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()]

  return (
    <div style={{ padding: '8px 16px 16px' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 6px 14px' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em', color: '#B5A3A3' }}>{wd} · {dateLabel}</div>
          <div style={{ fontFamily: 'Quicksand', fontSize: 22, color: '#3A2E2E', letterSpacing: '-0.01em', marginTop: 2 }}>
            早安， <span style={{ color: '#6E5A5A', fontWeight: 400 }}>嬛嬛</span>
          </div>
        </div>
        <div onClick={openPicker} style={{
          width: 44, height: 44, borderRadius: 999,
          background: 'linear-gradient(135deg, oklch(0.88 0.05 15), oklch(0.78 0.06 25))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: 'Quicksand', fontSize: 17, fontWeight: 500,
          cursor: 'pointer', overflow: 'hidden',
          boxShadow: '0 4px 14px oklch(0.78 0.06 25 / 0.3)',
        }}>
          {avatarBase64 ? <img src={avatarBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '嬛'}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChosen} style={{ display: 'none' }} />
      </div>

      {/* Hero card */}
      <div style={{
        background: '#FFFFFF', borderRadius: 28, padding: 22,
        boxShadow: '0 10px 30px rgba(58,46,46,0.06), 0 2px 6px rgba(58,46,46,0.04)',
      }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, letterSpacing: '0.14em', color: '#B5A3A3', textTransform: 'uppercase' }}>
          THIS MONTH · {monthLabel}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
          <div style={{ fontFamily: 'Quicksand', fontSize: 52, lineHeight: 1, fontWeight: 400, letterSpacing: '-0.03em', color: '#3A2E2E' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 15, color: '#B5A3A3', marginRight: 4 }}>NT$</span>
            {loading ? '—' : monthTotal.toLocaleString()}
          </div>
        </div>
        <div style={{ fontFamily: 'Nunito', fontSize: 12, color: '#6E5A5A', marginTop: 10 }}>
          食 · 醫 · 用 · 其他
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, letterSpacing: '0.14em', color: '#B5A3A3', marginLeft: 6, marginBottom: 8, textTransform: 'uppercase' }}>QUICK LOG</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {QUICK_ACTIONS.map(a => (
            <button key={a.label} onClick={() => navigate(a.to)} style={{
              background: a.primary ? '#3A2E2E' : '#FFFFFF',
              color: a.primary ? '#FBF6F1' : '#3A2E2E',
              border: 'none', borderRadius: 20, padding: '14px 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: '0 4px 12px rgba(58,46,46,0.05)', cursor: 'pointer',
            }}>
              <div style={{ fontFamily: 'Quicksand', fontSize: 16, fontWeight: 500 }}>{a.label}</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8.5, letterSpacing: '0.14em', opacity: 0.6 }}>{a.sub.toUpperCase()}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Memory */}
      {memoryPhotos.length > 0 && (
        <div onClick={() => navigate('/photos')} style={{
          marginTop: 16, background: '#FFFFFF', borderRadius: 24, padding: 16,
          boxShadow: '0 8px 24px rgba(58,46,46,0.05)', cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, letterSpacing: '0.14em', color: '#B5A3A3' }}>ONE YEAR AGO</div>
              <div style={{ fontFamily: 'Quicksand', fontSize: 17, color: '#3A2E2E', marginTop: 2 }}>那天的陽光剛好</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {memoryPhotos.map((p, i) => (
              <div key={i} style={{ flex: 1, aspectRatio: '1', borderRadius: 14, overflow: 'hidden', background: '#F0E4E0' }}>
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div style={{ marginTop: 16, paddingLeft: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, letterSpacing: '0.14em', color: '#B5A3A3', textTransform: 'uppercase' }}>RECENT</div>
          <button onClick={() => navigate('/expenses')} style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'oklch(0.78 0.06 25)', letterSpacing: '0.1em', background: 'none', border: 'none', cursor: 'pointer' }}>
            SEE ALL →
          </button>
        </div>
        <div style={{ marginTop: 8 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} style={{ height: 48, background: '#F0E4E0', borderRadius: 14, marginBottom: 6, opacity: 0.5 }} />)
          ) : recentExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#B5A3A3', fontSize: 13 }}>還沒有花費紀錄</div>
          ) : (
            recentExpenses.map((it, i) => (
              <div key={it.id} onClick={() => navigate('/expenses')} style={{
                display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 10,
                padding: '10px 6px',
                borderTop: i > 0 ? '1px solid #F0E4E0' : 'none',
                alignItems: 'center', cursor: 'pointer',
              }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3' }}>{it.date?.slice(5)}</div>
                <div>
                  <div style={{ fontFamily: 'Quicksand', fontSize: 15, fontWeight: 500, color: '#3A2E2E' }}>{it.name}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: '#B5A3A3', letterSpacing: '0.1em', marginTop: 1 }}>
                    {EXPENSE_CATEGORIES[it.category]}
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#3A2E2E' }}>${it.amount?.toLocaleString()}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {cropFile && <AvatarCropModal imageFile={cropFile} onConfirm={handleConfirm} onCancel={() => setCropFile(null)} onReset={handleReset} />}
    </div>
  )
}
