import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2 } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const COLORS = { food: '#4AAFDC', medical: '#F87171', supplies: '#34D399', other: '#C084FC' }

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.ex-page { background: #F5F0EB; min-height: 100%; padding: 20px 20px 48px; }
.ex-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ex-title { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.ex-add { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 100px; border: none; cursor: pointer; }
.ex-add:active { opacity: 0.8; transform: scale(0.97); }
.ex-hero { position: relative; background: rgba(255,255,255,0.72); border-radius: 22px; border: 1px solid rgba(176,216,238,0.45); padding: 18px 20px; margin-bottom: 22px; backdrop-filter: blur(8px); overflow: hidden; }
.ex-hero-blob { position: absolute; top: -40px; right: -50px; width: 160px; height: 160px; background: radial-gradient(ellipse, rgba(74,175,220,0.18) 0%, transparent 70%); border-radius: 50%; pointer-events: none; }
.ex-hero-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.14em; color: #9BBDD0; text-transform: uppercase; }
.ex-hero-amount { font-family: 'Caveat', cursive; font-size: 48px; font-weight: 700; color: #1A4F6E; line-height: 1.05; letter-spacing: -1px; margin-top: 2px; }
.ex-hero-currency { font-size: 24px; opacity: 0.45; margin-right: 2px; }
.ex-hero-sub { font-size: 12px; color: #9BBDD0; font-weight: 500; margin-top: 4px; }
.ex-group-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #9BBDD0; text-transform: uppercase; margin-bottom: 8px; margin-top: 18px; display: flex; align-items: center; justify-content: space-between; }
.ex-group-total { font-family: 'Caveat', cursive; font-size: 15px; font-weight: 700; color: #7BAEC8; letter-spacing: 0; }
.ex-row { display: flex; align-items: center; gap: 12px; padding: 13px 15px; background: rgba(255,255,255,0.76); border-radius: 16px; margin-bottom: 6px; border: 1px solid rgba(176,216,238,0.4); backdrop-filter: blur(4px); }
.ex-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.ex-info { flex: 1; min-width: 0; }
.ex-name { font-size: 14px; font-weight: 600; color: #1A4F6E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ex-sub { font-size: 11px; color: #9BBDD0; margin-top: 2px; }
.ex-amount { font-family: 'Caveat', cursive; font-size: 20px; font-weight: 700; color: #2A6F96; flex-shrink: 0; }
.ex-del { color: #C8DDE8; background: none; border: none; cursor: pointer; padding: 5px; flex-shrink: 0; transition: color 0.15s; }
.ex-del:active { color: #F87171; }
.ex-empty { text-align: center; padding: 64px 0; }
.ex-empty-icon { font-size: 48px; margin-bottom: 14px; }
.ex-empty-text { font-size: 14px; color: #9BBDD0; margin-bottom: 22px; font-weight: 500; }
.skel { background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 16px; height: 56px; margin-bottom: 6px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

export default function Expenses() {
  const navigate = useNavigate()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'expenses'), orderBy('date', 'desc')))
      .then(snap => setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    await deleteDoc(doc(db, 'expenses', id))
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const monthLabel = `${now.getMonth() + 1}月`
  const monthTotal = expenses.filter(e => e.date >= monthStart).reduce((s, e) => s + (e.amount || 0), 0)

  const groups = expenses.reduce((acc, e) => {
    const m = e.date?.slice(0, 7) || ''
    if (!acc[m]) acc[m] = []
    acc[m].push(e)
    return acc
  }, {})

  return (
    <div className="ex-page">
      <style>{S}</style>

      <div className="ex-top">
        <div className="ex-title">花費記帳</div>
        <button className="ex-add" onClick={() => navigate('/expenses/new')}>
          <Plus size={14} /> 新增
        </button>
      </div>

      {!loading && expenses.length > 0 && (
        <div className="ex-hero fade-in">
          <div className="ex-hero-blob" />
          <div className="ex-hero-lbl">{monthLabel} · 本月花費</div>
          <div className="ex-hero-amount">
            <span className="ex-hero-currency">$</span>
            {monthTotal.toLocaleString()}
          </div>
          <div className="ex-hero-sub">共 {expenses.filter(e => e.date >= monthStart).length} 筆記錄</div>
        </div>
      )}

      {loading ? (
        <div style={{ marginTop: 8 }}>{[1, 2, 3, 4].map(i => <div key={i} className="skel" />)}</div>
      ) : expenses.length === 0 ? (
        <div className="ex-empty">
          <div className="ex-empty-icon">💰</div>
          <div className="ex-empty-text">還沒有花費紀錄</div>
          <button className="ex-add" onClick={() => navigate('/expenses/new')} style={{ margin: '0 auto' }}>
            <Plus size={14} /> 新增花費
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {Object.entries(groups).map(([month, items]) => {
            const groupTotal = items.reduce((s, e) => s + (e.amount || 0), 0)
            const [y, m] = month.split('-')
            const label = `${y}年${parseInt(m)}月`
            return (
              <div key={month}>
                <div className="ex-group-lbl">
                  <span>{label}</span>
                  <span className="ex-group-total">${groupTotal.toLocaleString()}</span>
                </div>
                {items.map(exp => (
                  <div key={exp.id} className="ex-row">
                    <div className="ex-dot" style={{ background: COLORS[exp.category] || '#7BAEC8' }} />
                    <div className="ex-info">
                      <div className="ex-name">{exp.name}</div>
                      <div className="ex-sub">{CATEGORIES[exp.category]} · {exp.date?.slice(5)}</div>
                    </div>
                    <div className="ex-amount">${exp.amount?.toLocaleString()}</div>
                    <button className="ex-del" onClick={() => handleDelete(exp.id)}>
                      <Trash2 size={15} />
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
