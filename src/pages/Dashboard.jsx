import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const EXPENSE_CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_CATEGORY_COLORS = { food: '#5BB8E8', medical: '#F87171', supplies: '#34D399', other: '#C084FC' }

const QUICK_ACTIONS = [
  { label: '記帳', to: '/expenses/new', bg: '#1A4F6E', fg: '#fff' },
  { label: '飲食', to: '/diet/new', bg: '#E8F7EC', fg: '#1a6e3a' },
  { label: '健康', to: '/health/new', bg: '#FEE2E2', fg: '#991b1b' },
  { label: '照片', to: '/photos/new', bg: '#EDE9FE', fg: '#5b21b6' },
  { label: '清單', to: '/shopping/new', bg: '#FEF9C3', fg: '#713f12' },
]

const SHORTCUTS = [
  { label: '品牌', emoji: '🏷️', to: '/brands' },
  { label: '健康紀錄', emoji: '🩺', to: '/health' },
  { label: '照片日記', emoji: '🌿', to: '/photos' },
  { label: '報表', emoji: '📊', to: '/reports' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [recentExpenses, setRecentExpenses] = useState([])
  const [monthTotal, setMonthTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [memoryPhotos, setMemoryPhotos] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const expQ = query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(4))
        const snap = await getDocs(expQ)
        setRecentExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() })))

        const now = new Date()
        const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const allSnap = await getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc')))
        const total = allSnap.docs.map(d => d.data()).filter(d => d.date >= monthStart).reduce((s, d) => s + (d.amount || 0), 0)
        setMonthTotal(total)

        // 記憶回顧：去年前後 3 天
        const today = new Date()
        const lastYear = today.getFullYear() - 1
        const dates = []
        for (let d = -3; d <= 3; d++) {
          const dt = new Date(lastYear, today.getMonth(), today.getDate() + d)
          dates.push(dt.toISOString().slice(0, 10))
        }
        const photosSnap = await getDocs(collection(db, 'photos'))
        const memories = photosSnap.docs
          .map(d => d.data())
          .filter(p => dates.includes(p.date))
          .slice(0, 3)
        setMemoryPhotos(memories)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const now = new Date()
  const monthLabel = `${now.getMonth() + 1}月`

  return (
    <div className="min-h-full" style={{ background: '#F5F0EB', fontFamily: 'system-ui' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Noto+Serif+TC:wght@400;600&display=swap');

        .dash-hero {
          position: relative;
          padding: 28px 24px 0;
          overflow: hidden;
        }
        .dash-blob {
          position: absolute;
          top: -60px;
          right: -80px;
          width: 280px;
          height: 280px;
          background: radial-gradient(ellipse at 40% 40%, #C8E8F7 0%, #A8D5EE 50%, transparent 80%);
          border-radius: 60% 40% 70% 30% / 50% 60% 40% 50%;
          opacity: 0.55;
          pointer-events: none;
        }
        .dash-blob-2 {
          position: absolute;
          bottom: -40px;
          left: -60px;
          width: 200px;
          height: 200px;
          background: radial-gradient(ellipse, #FFE4C8 0%, transparent 70%);
          border-radius: 50% 30% 60% 40% / 40% 50% 50% 60%;
          opacity: 0.6;
          pointer-events: none;
        }
        .cat-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1A4F6E 0%, #4AAFDC 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(26,79,110,0.2);
        }
        .hero-name {
          font-family: 'Caveat', cursive;
          font-size: 36px;
          font-weight: 700;
          color: #1A4F6E;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .hero-month-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          color: #7BAEC8;
          text-transform: uppercase;
          margin-top: 14px;
        }
        .hero-amount {
          font-family: 'Caveat', cursive;
          font-size: 56px;
          font-weight: 700;
          color: #1A4F6E;
          line-height: 1.05;
          letter-spacing: -2px;
        }
        .hero-amount-currency {
          font-size: 28px;
          opacity: 0.5;
          margin-right: 2px;
        }
        .divider-line {
          height: 1px;
          background: linear-gradient(to right, #C8DDE8 0%, transparent 100%);
          margin: 0 24px;
        }
        .section-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.15em;
          color: #9BBDD0;
          text-transform: uppercase;
        }
        .quick-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 9px 18px;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          border: none;
          transition: transform 0.12s, box-shadow 0.12s;
          -webkit-tap-highlight-color: transparent;
        }
        .quick-pill:active { transform: scale(0.95); }
        .quick-pill-primary {
          background: #1A4F6E;
          color: #fff;
          box-shadow: 0 3px 10px rgba(26,79,110,0.25);
        }
        .shortcut-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 14px 8px;
          background: rgba(255,255,255,0.7);
          border-radius: 18px;
          border: 1px solid rgba(176,216,238,0.5);
          cursor: pointer;
          transition: transform 0.12s, background 0.12s;
          -webkit-tap-highlight-color: transparent;
          backdrop-filter: blur(4px);
        }
        .shortcut-item:active { transform: scale(0.94); background: rgba(255,255,255,0.9); }
        .shortcut-emoji { font-size: 22px; }
        .shortcut-label { font-size: 10px; font-weight: 600; color: #4A7A96; letter-spacing: 0.02em; }
        .expense-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px 0;
          border-bottom: 1px solid rgba(176,216,238,0.25);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .expense-row:last-child { border-bottom: none; }
        .expense-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .expense-name {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #1A4F6E;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .expense-meta {
          font-size: 11px;
          color: #9BBDD0;
          white-space: nowrap;
        }
        .expense-amount {
          font-family: 'Caveat', cursive;
          font-size: 18px;
          font-weight: 700;
          color: #2A6F96;
          flex-shrink: 0;
        }
        .skeleton {
          background: linear-gradient(90deg, rgba(176,216,238,0.2) 25%, rgba(176,216,238,0.4) 50%, rgba(176,216,238,0.2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 8px;
          height: 18px;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .fade-in {
          animation: fadeUp 0.4s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Hero */}
      <div className="dash-hero" style={{ paddingBottom: 24 }}>
        <div className="dash-blob" />
        <div className="dash-blob-2" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <div className="cat-avatar">🐱</div>
          <div>
            <div className="hero-name">嬛嬛</div>
            <div style={{ fontSize: 12, color: '#7BAEC8', fontWeight: 500, marginTop: 2 }}>的日記本</div>
          </div>
        </div>

        <div style={{ position: 'relative', marginTop: 20 }}>
          <div className="hero-month-label">{monthLabel} · 花費總計</div>
          <div className="hero-amount">
            <span className="hero-amount-currency">$</span>
            {loading ? '—' : monthTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '0 24px 20px' }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {QUICK_ACTIONS.map(({ label, to, bg, fg }) => (
            <button
              key={to}
              className="quick-pill"
              style={{ background: bg, color: fg }}
              onClick={() => navigate(to)}
            >
              + {label}
            </button>
          ))}
        </div>
      </div>

      <div className="divider-line" />

      {/* 記憶回顧 */}
      {memoryPhotos.length > 0 && (
        <div
          style={{ padding: '20px 24px', cursor: 'pointer' }}
          onClick={() => navigate('/photos')}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(255,235,210,0.7) 0%, rgba(200,232,247,0.6) 100%)',
              borderRadius: 20,
              padding: '16px',
              border: '1px solid rgba(176,216,238,0.4)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 20, fontWeight: 700, color: '#1A4F6E', marginBottom: 12 }}>
              一年前的今天 🌿
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {memoryPhotos.map((p, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#E8F4FC',
                  }}
                >
                  <img src={p.url} alt={p.title || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {memoryPhotos.length > 0 && <div className="divider-line" />}

      {/* Shortcuts */}
      <div style={{ padding: '20px 24px' }}>
        <div className="section-label" style={{ marginBottom: 12 }}>快速導覽</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {SHORTCUTS.map(({ label, emoji, to }) => (
            <div key={to} className="shortcut-item" onClick={() => navigate(to)}>
              <span className="shortcut-emoji">{emoji}</span>
              <span className="shortcut-label">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="divider-line" />

      {/* Recent Expenses */}
      <div style={{ padding: '20px 24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div className="section-label">最近花費</div>
          <button
            onClick={() => navigate('/expenses')}
            style={{ fontSize: 12, color: '#4AAFDC', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            全部 →
          </button>
        </div>

        {loading ? (
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
                <div className="skeleton" style={{ flex: 1 }} />
                <div className="skeleton" style={{ width: 52 }} />
              </div>
            ))}
          </div>
        ) : recentExpenses.length === 0 ? (
          <div style={{ paddingTop: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
            <p style={{ fontSize: 13, color: '#9BBDD0', marginBottom: 12 }}>還沒有花費紀錄</p>
            <button
              onClick={() => navigate('/expenses/new')}
              style={{ fontSize: 13, color: '#1A4F6E', fontWeight: 700, background: 'rgba(255,255,255,0.8)', border: '1px solid #B0D8EE', borderRadius: 100, padding: '8px 20px', cursor: 'pointer' }}
            >
              新增第一筆
            </button>
          </div>
        ) : (
          <div className="fade-in">
            {recentExpenses.map(exp => (
              <div key={exp.id} className="expense-row" onClick={() => navigate('/expenses')}>
                <div className="expense-dot" style={{ background: CAT_CATEGORY_COLORS[exp.category] || '#7BAEC8' }} />
                <div className="expense-name">{exp.name}</div>
                <div className="expense-meta">{EXPENSE_CATEGORIES[exp.category]} · {exp.date?.slice(5)}</div>
                <div className="expense-amount">${exp.amount?.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
