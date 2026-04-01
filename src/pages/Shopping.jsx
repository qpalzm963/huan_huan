import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, ArrowRight } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.sh-page { background: #F5F0EB; min-height: 100%; padding: 20px 20px 48px; }
.sh-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.sh-title { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.sh-add-btn { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 100px; border: none; cursor: pointer; }
.sh-add-btn:active { opacity: 0.8; transform: scale(0.97); }
.sh-stats { display: flex; gap: 8px; margin-bottom: 22px; }
.sh-stat { flex: 1; background: rgba(255,255,255,0.72); border-radius: 16px; border: 1px solid rgba(176,216,238,0.45); padding: 12px 12px 10px; backdrop-filter: blur(6px); }
.sh-stat-lbl { font-size: 9px; font-weight: 700; letter-spacing: 0.13em; color: #9BBDD0; text-transform: uppercase; }
.sh-stat-val { font-family: 'Caveat', cursive; font-size: 24px; font-weight: 700; color: #1A4F6E; line-height: 1.2; margin-top: 1px; }
.sh-stat-unit { font-size: 12px; font-family: system-ui; opacity: 0.45; }
.sh-section-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #9BBDD0; text-transform: uppercase; margin-bottom: 10px; }
.sh-card { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: rgba(255,255,255,0.76); border-radius: 18px; margin-bottom: 7px; border: 1px solid rgba(176,216,238,0.4); backdrop-filter: blur(5px); }
.sh-card.is-done { opacity: 0.5; }
.sh-toggle { background: none; border: none; cursor: pointer; padding: 2px; flex-shrink: 0; transition: transform 0.12s; }
.sh-toggle:active { transform: scale(0.82); }
.sh-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 10px; flex-shrink: 0; }
.sh-body { flex: 1; min-width: 0; cursor: pointer; }
.sh-name { font-size: 14px; font-weight: 600; color: #1A4F6E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sh-name.done { text-decoration: line-through; color: #9BBDD0; }
.sh-meta { display: flex; align-items: center; gap: 5px; margin-top: 3px; flex-wrap: wrap; }
.sh-cat { font-size: 10px; font-weight: 600; color: #9BBDD0; }
.sh-price { font-size: 11px; font-weight: 700; color: #4AAFDC; }
.sh-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.sh-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; color: #C8DDE8; transition: color 0.15s; }
.sh-icon-btn.red:active { color: #F87171; }
.sh-icon-btn:active { transform: scale(0.88); }
.sh-transfer { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 700; color: #4AAFDC; background: rgba(74,175,220,0.1); border: none; border-radius: 8px; padding: 5px 9px; cursor: pointer; flex-shrink: 0; }
.sh-transfer:active { opacity: 0.7; }
.sh-empty { text-align: center; padding: 64px 0; }
.sh-empty-icon { font-size: 48px; margin-bottom: 14px; }
.sh-empty-text { font-size: 14px; color: #9BBDD0; margin-bottom: 22px; font-weight: 500; line-height: 1.6; }
.sh-divider { height: 1px; background: linear-gradient(to right, #C8DDE8 0%, transparent 100%); margin: 18px 0; }
.skel { background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 18px; height: 64px; margin-bottom: 7px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

export default function Shopping() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const q = query(collection(db, 'shopping'), orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      all.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1))
      setItems(all)
    } catch (e) { console.error('shopping load error', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item) {
    const ref = doc(db, 'shopping', item.id)
    const update = item.done
      ? { done: false, doneAt: null }
      : { done: true, doneAt: Timestamp.now() }
    await updateDoc(ref, update)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, ...update } : i)
      .sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1)))
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, 'shopping', id))
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function transferToExpense(item) {
    navigate('/expenses/new', {
      state: { name: item.name, category: item.category, amount: item.estimatedPrice || '' }
    })
  }

  const pending = items.filter(i => !i.done && i.name)
  const done = items.filter(i => i.done && i.name)
  const estimatedTotal = pending.reduce((s, i) => s + (i.latestPrice ?? i.estimatedPrice ?? 0), 0)
  const hasItems = pending.length > 0 || done.length > 0

  return (
    <div className="sh-page">
      <style>{S}</style>

      <div className="sh-top">
        <div className="sh-title">購物清單</div>
        <button className="sh-add-btn" onClick={() => navigate('/shopping/new')}>
          <Plus size={14} /> 新增
        </button>
      </div>

      {!loading && hasItems && (
        <div className="sh-stats fade-in">
          <div className="sh-stat">
            <div className="sh-stat-lbl">待購買</div>
            <div className="sh-stat-val">{pending.length}<span className="sh-stat-unit"> 項</span></div>
          </div>
          <div className="sh-stat">
            <div className="sh-stat-lbl">預估花費</div>
            <div className="sh-stat-val">{estimatedTotal > 0 ? `$${estimatedTotal.toLocaleString()}` : '—'}</div>
          </div>
          <div className="sh-stat">
            <div className="sh-stat-lbl">已購買</div>
            <div className="sh-stat-val">{done.length}<span className="sh-stat-unit"> 項</span></div>
          </div>
        </div>
      )}

      {loading ? (
        <div>{[1,2,3,4].map(i => <div key={i} className="skel" />)}</div>
      ) : !hasItems ? (
        <div className="sh-empty">
          <div className="sh-empty-icon">🛒</div>
          <div className="sh-empty-text">購物清單是空的<br />記錄想幫嬛嬛買的東西</div>
          <button className="sh-add-btn" style={{ margin: '0 auto' }} onClick={() => navigate('/shopping/new')}>
            <Plus size={14} /> 新增項目
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {pending.length > 0 && (
            <div>
              <div className="sh-section-lbl">待購買 · {pending.length}</div>
              {pending.map(item => {
                const price = item.latestPrice ?? item.estimatedPrice ?? null
                const trend = item.latestPrice != null && item.previousPrice != null
                  ? item.latestPrice > item.previousPrice ? 'up' : item.latestPrice < item.previousPrice ? 'down' : 'same'
                  : null
                return (
                  <div key={item.id} className="sh-card">
                    <button className="sh-toggle" onClick={() => toggleDone(item)}>
                      <Circle size={22} color="#B0D8EE" />
                    </button>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="sh-thumb" />}
                    <div className="sh-body" onClick={() => navigate(`/shopping/${item.id}`)}>
                      <div className="sh-name">{item.name}</div>
                      <div className="sh-meta">
                        <span className="sh-cat">{CATEGORIES[item.category] || item.category}</span>
                        {price != null && (
                          <>
                            <span style={{ fontSize: 10, color: '#C8DDE8' }}>·</span>
                            <span className="sh-price">${price.toLocaleString()}</span>
                            {trend === 'up' && <span style={{ fontSize: 10, fontWeight: 700, color: '#F87171' }}>↑</span>}
                            {trend === 'down' && <span style={{ fontSize: 10, fontWeight: 700, color: '#34D399' }}>↓</span>}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="sh-actions">
                      <button className="sh-icon-btn" onClick={() => navigate(`/shopping/${item.id}`)}>
                        <ChevronRight size={15} />
                      </button>
                      <button className="sh-icon-btn red" onClick={() => handleDelete(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pending.length > 0 && done.length > 0 && <div className="sh-divider" />}

          {done.length > 0 && (
            <div>
              <div className="sh-section-lbl">已購買 · {done.length}</div>
              {done.map(item => (
                <div key={item.id} className="sh-card is-done">
                  <button className="sh-toggle" onClick={() => toggleDone(item)}>
                    <CheckCircle2 size={22} color="#4AAFDC" />
                  </button>
                  <div className="sh-body">
                    <div className="sh-name done">{item.name}</div>
                    <div className="sh-meta">
                      <span className="sh-cat">{CATEGORIES[item.category] || item.category}</span>
                    </div>
                  </div>
                  <div className="sh-actions">
                    <button className="sh-transfer" onClick={() => transferToExpense(item)}>
                      記帳 <ArrowRight size={10} />
                    </button>
                    <button className="sh-icon-btn red" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
