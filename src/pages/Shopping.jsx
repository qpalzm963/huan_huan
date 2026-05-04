import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, CheckCircle2, Circle, ChevronRight, ArrowRight } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = {
  food: 'oklch(0.78 0.06 25)',
  medical: 'oklch(0.78 0.06 25)',
  supplies: 'oklch(0.78 0.05 75)',
  other: '#B5A3A3',
}

const S = `
.sh-stats { display: flex; gap: 8px; margin-bottom: 16px; }
.sh-stat { flex: 1; background: #FFFFFF; border-radius: 18px; padding: 12px 14px; box-shadow: 0 2px 8px rgba(58,46,46,0.05); }
.sh-stat-lbl { font-family: 'JetBrains Mono'; font-size: 9px; letter-spacing: 0.14em; color: #B5A3A3; text-transform: uppercase; }
.sh-stat-val { font-family: 'Quicksand'; font-size: 22px; color: #3A2E2E; line-height: 1.2; margin-top: 4px; letter-spacing: -0.01em; }
.sh-stat-unit { font-family: 'Nunito'; font-size: 11px; color: #B5A3A3; margin-left: 2px; }
.sh-section-lbl { font-family: 'JetBrains Mono'; font-size: 9.5px; letter-spacing: 0.14em; color: #B5A3A3; text-transform: uppercase; margin: 0 6px 10px; }
.sh-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: #FFFFFF; border-radius: 18px; margin-bottom: 7px; box-shadow: 0 2px 8px rgba(58,46,46,0.04); }
.sh-card.is-done { opacity: 0.55; }
.sh-toggle { background: none; border: none; cursor: pointer; padding: 2px; flex-shrink: 0; transition: transform 0.12s; display: flex; }
.sh-toggle:active { transform: scale(0.85); }
.sh-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 12px; flex-shrink: 0; }
.sh-body { flex: 1; min-width: 0; cursor: pointer; }
.sh-name { font-family: 'Quicksand'; font-size: 14.5px; font-weight: 500; color: #3A2E2E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sh-name.done { text-decoration: line-through; color: #B5A3A3; }
.sh-meta { display: flex; align-items: center; gap: 6px; margin-top: 3px; flex-wrap: wrap; }
.sh-cat { font-family: 'Nunito'; font-size: 11px; color: #B5A3A3; }
.sh-price { font-family: 'JetBrains Mono'; font-size: 12px; color: #3A2E2E; }
.sh-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.sh-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; color: #D8C8C8; transition: color 0.15s; display: flex; }
.sh-icon-btn.red:active { color: oklch(0.65 0.18 25); }
.sh-icon-btn:active { transform: scale(0.88); }
.sh-transfer { display: flex; align-items: center; gap: 4px; font-family: 'Nunito'; font-size: 11px; font-weight: 600; color: oklch(0.45 0.07 145); background: oklch(0.82 0.05 145 / 0.22); border: none; border-radius: 999px; padding: 5px 10px; cursor: pointer; flex-shrink: 0; }
.sh-transfer:active { opacity: 0.75; }
.sh-empty { text-align: center; padding: 64px 16px; }
.sh-empty-icon { font-size: 44px; margin-bottom: 14px; }
.sh-empty-title { font-family: 'Quicksand'; font-size: 18px; color: #6E5A5A; margin-bottom: 8px; }
.sh-empty-desc { font-family: 'Nunito'; font-size: 12px; color: #B5A3A3; margin-bottom: 22px; line-height: 1.5; }
.sh-divider { height: 1px; background: linear-gradient(to right, #E8DDD3 0%, transparent 100%); margin: 18px 0; }
.skel { background: linear-gradient(90deg, rgba(58,46,46,0.04) 25%, rgba(58,46,46,0.08) 50%, rgba(58,46,46,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 18px; height: 64px; margin-bottom: 7px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

const addBtnStyle = {
  background: '#3A2E2E', color: '#FBF6F1', border: 'none',
  padding: '8px 14px', borderRadius: 999,
  fontFamily: 'Nunito', fontWeight: 600, fontSize: 12,
  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
}

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
    <div style={{ padding: '8px 16px 16px' }}>
      <style>{S}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 6px 14px' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em', color: '#B5A3A3' }}>SECTION · 單</div>
          <div style={{ fontFamily: 'Quicksand', fontSize: 26, color: '#3A2E2E', letterSpacing: '-0.01em', marginTop: 2 }}>
            <span>購物</span> 清單
          </div>
        </div>
        <button style={addBtnStyle} onClick={() => navigate('/shopping/new')}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {!loading && hasItems && (
        <div className="sh-stats fade-in">
          <div className="sh-stat">
            <div className="sh-stat-lbl">待購買</div>
            <div className="sh-stat-val">{pending.length}<span className="sh-stat-unit">項</span></div>
          </div>
          <div className="sh-stat">
            <div className="sh-stat-lbl">預估花費</div>
            <div className="sh-stat-val" style={{ fontFamily: 'JetBrains Mono', fontSize: 18 }}>
              {estimatedTotal > 0 ? `$${estimatedTotal.toLocaleString()}` : '—'}
            </div>
          </div>
          <div className="sh-stat">
            <div className="sh-stat-lbl">已購買</div>
            <div className="sh-stat-val">{done.length}<span className="sh-stat-unit">項</span></div>
          </div>
        </div>
      )}

      {loading ? (
        <div>{[1,2,3,4].map(i => <div key={i} className="skel" />)}</div>
      ) : !hasItems ? (
        <div className="sh-empty">
          <div className="sh-empty-icon">🛒</div>
          <div className="sh-empty-title">購物清單是空的</div>
          <div className="sh-empty-desc">記錄想幫嬛嬛買的東西</div>
          <button style={{ ...addBtnStyle, margin: '0 auto' }} onClick={() => navigate('/shopping/new')}>
            <Plus size={13} /> 新增項目
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
                      <Circle size={22} color="#D8C8C8" />
                    </button>
                    {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="sh-thumb" />}
                    <div className="sh-body" onClick={() => navigate(`/shopping/${item.id}`)}>
                      <div className="sh-name">{item.name}</div>
                      <div className="sh-meta">
                        <span className="sh-cat" style={{ color: CAT_COLORS[item.category] || '#B5A3A3' }}>
                          {CATEGORIES[item.category] || item.category}
                        </span>
                        {price != null && (
                          <>
                            <span style={{ fontSize: 10, color: '#D8C8C8' }}>·</span>
                            <span className="sh-price">${price.toLocaleString()}</span>
                            {trend === 'up' && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'oklch(0.65 0.18 25)' }}>↑</span>}
                            {trend === 'down' && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: 'oklch(0.55 0.12 145)' }}>↓</span>}
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
                    <CheckCircle2 size={22} color="#3A2E2E" />
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
