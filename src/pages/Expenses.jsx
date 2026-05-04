import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { Plus, Trash2 } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const COLORS = {
  food: 'oklch(0.88 0.05 15)',
  medical: 'oklch(0.78 0.06 25)',
  supplies: 'oklch(0.78 0.05 75)',
  other: '#B5A3A3',
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

  return (
    <div style={{ padding: '8px 16px 16px' }}>
      {/* Hero */}
      <div style={{
        background: 'linear-gradient(150deg, oklch(0.88 0.05 15) 0%, oklch(0.94 0.04 20) 100%)',
        color: '#3A2E2E', borderRadius: 28, padding: 22,
        boxShadow: '0 10px 30px oklch(0.78 0.06 25 / 0.2)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em', opacity: 0.65 }}>
              {monthLabel.toUpperCase()} · 本月花費
            </div>
            <div style={{ fontFamily: 'Quicksand', fontSize: 56, lineHeight: 0.95, fontWeight: 400, letterSpacing: '-0.03em', marginTop: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 16, opacity: 0.6, marginRight: 4 }}>NT$</span>
              {monthTotal.toLocaleString()}
            </div>
            <div style={{ fontFamily: 'Nunito', fontSize: 12, marginTop: 6, opacity: 0.75 }}>
              {monthExp.length} 筆
            </div>
          </div>
          <button onClick={() => navigate('/expenses/new')} style={{
            background: '#3A2E2E', color: '#FBF6F1', border: 'none',
            padding: '8px 14px', borderRadius: 999,
            fontFamily: 'Nunito', fontWeight: 600, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}>
            <Plus size={13} /> 新增
          </button>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 6, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {[['all','全部'], ['food','食品'], ['medical','醫療'], ['supplies','用品'], ['other','其他']].map(([k, l]) => (
          <span key={k} onClick={() => setFilter(k)} style={{
            padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap',
            background: filter === k ? '#3A2E2E' : '#FFFFFF',
            color: filter === k ? '#FBF6F1' : '#6E5A5A',
            fontFamily: 'Nunito', fontSize: 12, fontWeight: 500,
            boxShadow: filter === k ? 'none' : '0 2px 6px rgba(58,46,46,0.05)',
            cursor: 'pointer',
          }}>{l}</span>
        ))}
      </div>

      {loading ? (
        <div style={{ marginTop: 14 }}>{[1,2,3,4].map(i => <div key={i} style={{ height: 56, background: '#FFFFFF', borderRadius: 18, marginBottom: 6, opacity: 0.6 }} />)}</div>
      ) : visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px', color: '#B5A3A3' }}>
          <div style={{ fontFamily: 'Quicksand', fontSize: 18, marginBottom: 12, color: '#6E5A5A' }}>還沒有紀錄</div>
          <button onClick={() => navigate('/expenses/new')} style={{
            background: '#3A2E2E', color: '#FBF6F1', border: 'none',
            padding: '10px 18px', borderRadius: 999, fontFamily: 'Nunito', fontSize: 13, fontWeight: 600, cursor: 'pointer',
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
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, letterSpacing: '0.14em', color: '#B5A3A3' }}>{y} · {parseInt(mm)}月</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6E5A5A' }}>${total.toLocaleString()}</div>
                </div>
                {items.map(it => (
                  <div key={it.id} style={{
                    background: '#FFFFFF', borderRadius: 18, padding: '12px 14px', marginBottom: 6,
                    display: 'grid', gridTemplateColumns: 'auto 44px 1fr auto auto', gap: 10, alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(58,46,46,0.04)',
                  }}>
                    {it.photo?.url ? (
                      <a href={it.photo.url} target="_blank" rel="noreferrer">
                        <img src={it.photo.url} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
                      </a>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: COLORS[it.category] || '#B5A3A3' }} />
                    )}
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3' }}>{it.date?.slice(5)}</div>
                    <div>
                      <div style={{ fontFamily: 'Quicksand', fontSize: 15, fontWeight: 500, color: '#3A2E2E' }}>{it.name}</div>
                      <div style={{ fontFamily: 'Nunito', fontSize: 11, color: '#B5A3A3' }}>{CATEGORIES[it.category]}</div>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#3A2E2E' }}>${it.amount?.toLocaleString()}</div>
                    <button onClick={() => handleDelete(it.id)} style={{ background: 'none', border: 'none', color: '#D8C8C8', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
