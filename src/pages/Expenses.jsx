import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { Plus, Trash2 } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const COLORS = {
  food:     { soft: '#FFD4B0', deep: '#FFA877' },
  medical:  { soft: '#C8EBD9', deep: '#7FCCA6' },
  supplies: { soft: '#E0CFF2', deep: '#B594D9' },
  other:    { soft: '#C8E0F2', deep: '#7FB3DB' },
}

export default function Expenses() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc')))
      .then(snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    const exp = expenses.find(e => e.id === id)
    if (exp?.photo?.path) deleteObject(ref(storage, exp.photo.path)).catch(() => {})
    await deleteDoc(doc(db, 'expenses', id))
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthLabel = `${now.getMonth() + 1}月`
  const monthExp = expenses.filter(e => e.date >= monthStart)
  const monthTotal = monthExp.reduce((s, e) => s + (e.amount || 0), 0)

  const visible = filter === 'all' ? expenses : expenses.filter(e => e.category === filter)

  const groups = visible.reduce((acc, e) => {
    const m = e.date?.slice(0, 7) || ''
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  const chips = [
    ['all',      '全部', '#3D2A2A'],
    ['food',     '食品', '#FFA877'],
    ['medical',  '醫療', '#7FCCA6'],
    ['supplies', '用品', '#B594D9'],
    ['other',    '其他', '#7FB3DB'],
  ]

  return (
    <div style={{ padding: '4px 14px 16px' }}>
      {/* Hero */}
      <div style={{
        background: '#FFD4B0', borderRadius: 26, padding: 20,
        border: '2px solid #3D2A2A',
        boxShadow: '0 4px 0 #3D2A2A',
        position: 'relative',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', right: 16, top: 14, transform: 'rotate(-10deg)' }}>
          <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" fill="#FFFFFF" />
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, fontWeight: 600, color: '#3D2A2A' }}>{monthLabel} ♡</div>
            <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 56, lineHeight: 0.95, fontWeight: 700, letterSpacing: '-0.03em', color: '#3D2A2A', marginTop: 4 }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 16, fontWeight: 500 }}>NT$</span>
              {monthTotal.toLocaleString()}
            </div>
            <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#3D2A2A', opacity: 0.7, marginTop: 6 }}>
              {monthExp.length} 筆 · 本月花費
            </div>
          </div>
          <button onClick={() => navigate('/expenses/new')} style={{
            background: '#3D2A2A', color: '#FFFFFF',
            border: '2px solid #3D2A2A',
            padding: '8px 14px', borderRadius: 999,
            fontFamily: "'Fredoka', system-ui", fontWeight: 700, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            boxShadow: '0 3px 0 #FFB388',
          }}>
            <Plus size={13} /> 新增
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {chips.map(([k, l, col]) => {
          const on = filter === k
          return (
            <span key={k} onClick={() => setFilter(k)} style={{
              padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap',
              background: on ? col : '#FFFFFF',
              color: on ? '#FFFFFF' : '#3D2A2A',
              border: '2px solid #3D2A2A',
              fontFamily: "'Fredoka', system-ui", fontSize: 12, fontWeight: 600,
              boxShadow: on ? '0 2px 0 #3D2A2A' : '0 2px 0 rgba(61,42,42,0.6)',
              cursor: 'pointer',
            }}>{l}</span>
          )
        })}
      </div>

      {loading ? (
        <div style={{ marginTop: 14 }}>{[1,2,3,4].map(i => <div key={i} style={{ height: 56, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 16, marginBottom: 6, opacity: 0.6 }} />)}</div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600, color: '#3D2A2A', marginBottom: 6 }}>還沒有紀錄</div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600, marginBottom: 12 }}>♡ 來記第一筆吧</div>
          <button onClick={() => navigate('/expenses/new')} style={{
            background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A',
            padding: '10px 18px', borderRadius: 999, fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 3px 0 #FFA877',
          }}>＋ 新增第一筆</button>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          {Object.entries(groups).map(([m, items]) => {
            const total = items.reduce((s, e) => s + (e.amount || 0), 0)
            const [y, mm] = m.split('-')
            return (
              <div key={m} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0 6px 6px' }}>
                  <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>{y} · {parseInt(mm)}月 ♡</div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 11, color: '#7A5C5C' }}>${total.toLocaleString()}</div>
                </div>
                {items.map(it => {
                  const c = COLORS[it.category] || COLORS.other
                  return (
                    <div key={it.id} style={{
                      background: '#FFFFFF', borderRadius: 16, padding: '10px 12px', marginBottom: 6,
                      border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
                      display: 'grid', gridTemplateColumns: 'auto 28px 1fr auto auto', gap: 10, alignItems: 'center',
                    }}>
                      {it.photo?.url ? (
                        <a href={it.photo.url} target="_blank" rel="noreferrer">
                          <img src={it.photo.url} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', border: '1.5px solid #3D2A2A' }} />
                        </a>
                      ) : (
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: c.soft, border: '1.5px solid #3D2A2A' }} />
                      )}
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 9, color: '#C4A8A8' }}>{it.date?.slice(5)}</div>
                      <div>
                        <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 14, fontWeight: 600, color: '#3D2A2A' }}>{it.name}</div>
                        <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: '#7A5C5C' }}>{CATEGORIES[it.category]}</div>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 13, fontWeight: 500, color: '#3D2A2A' }}>${it.amount?.toLocaleString()}</div>
                      <button onClick={() => handleDelete(it.id)} style={{ background: 'none', border: 'none', color: '#C4A8A8', cursor: 'pointer', padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
