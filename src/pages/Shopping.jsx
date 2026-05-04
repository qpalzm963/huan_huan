import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, query, orderBy, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, ArrowRight } from 'lucide-react'

const CATEGORIES = { food: '食品', medical: '醫療', supplies: '用品', other: '其他' }
const CAT_COLORS = {
  food:     '#FFD4B0',
  medical:  '#C8EBD9',
  supplies: '#E0CFF2',
  other:    '#C8E0F2',
}

const addBtnStyle = {
  background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A',
  padding: '8px 14px', borderRadius: 999,
  fontFamily: "'Fredoka', system-ui", fontWeight: 700, fontSize: 12,
  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
  boxShadow: '0 3px 0 #B594D9',
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
    const update = item.done ? { done: false, doneAt: null } : { done: true, doneAt: Timestamp.now() }
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
    <div style={{ padding: '4px 14px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 14px' }}>
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>shopping list ♡</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 26, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 2 }}>
            購物清單
          </div>
        </div>
        <button style={addBtnStyle} onClick={() => navigate('/shopping/new')}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {/* Stats trio */}
      {!loading && hasItems && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[
            { k: '待購買', v: String(pending.length), u: '項', col: '#FFC8D6' },
            { k: '預估', v: estimatedTotal > 0 ? `$${estimatedTotal.toLocaleString()}` : '—', u: '', col: '#FFE4A0', mono: true },
            { k: '已購', v: String(done.length), u: '項', col: '#C8EBD9' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, background: s.col, borderRadius: 16, padding: '10px 10px',
              border: '2px solid #3D2A2A', boxShadow: '0 3px 0 #3D2A2A',
            }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 8, letterSpacing: '0.14em', color: '#3D2A2A', opacity: 0.7 }}>
                {s.k.toUpperCase()}
              </div>
              <div style={{
                fontFamily: s.mono ? "'JetBrains Mono', ui-monospace" : "'Fredoka', system-ui",
                fontSize: s.mono ? 17 : 22, fontWeight: 700, lineHeight: 1.1,
                marginTop: 4, letterSpacing: '-0.01em', color: '#3D2A2A',
              }}>
                {s.v}<span style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: '#7A5C5C', marginLeft: 2, fontWeight: 500 }}>{s.u}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div>{[1,2,3,4].map(i => <div key={i} style={{ height: 56, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 16, marginBottom: 6, opacity: 0.5 }} />)}</div>
      ) : !hasItems ? (
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600, color: '#3D2A2A', marginBottom: 6 }}>清單是空的</div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600, marginBottom: 12 }}>♡ 記錄想幫嬛嬛買的東西</div>
          <button style={{ ...addBtnStyle, margin: '0 auto' }} onClick={() => navigate('/shopping/new')}>
            <Plus size={13} /> 新增項目
          </button>
        </div>
      ) : (
        <div>
          {/* Pending */}
          {pending.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingLeft: 4, marginBottom: 8 }}>
                <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, color: '#FF92AE', fontWeight: 700, letterSpacing: '-0.01em' }}>待購買 · {pending.length}</span>
              </div>
              {pending.map(item => {
                const price = item.latestPrice ?? item.estimatedPrice ?? null
                const trend = item.latestPrice != null && item.previousPrice != null
                  ? item.latestPrice > item.previousPrice ? 'up' : item.latestPrice < item.previousPrice ? 'down' : 'same'
                  : null
                return (
                  <div key={item.id} style={{
                    background: '#FFFFFF', borderRadius: 16, padding: '10px 12px', marginBottom: 6,
                    border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
                    display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 10, alignItems: 'center',
                  }}>
                    <button onClick={() => toggleDone(item)} style={{
                      width: 22, height: 22, borderRadius: 999,
                      border: '2px solid #3D2A2A', background: '#fff',
                      cursor: 'pointer', padding: 0,
                    }} />
                    <div onClick={() => navigate(`/shopping/${item.id}`)} style={{ minWidth: 0, cursor: 'pointer' }}>
                      <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 14, fontWeight: 600, color: '#3D2A2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: "'Fredoka', system-ui", fontSize: 10, fontWeight: 600,
                          padding: '1px 7px', borderRadius: 99,
                          background: CAT_COLORS[item.category] || '#C8E0F2', border: '1.5px solid #3D2A2A', color: '#3D2A2A',
                        }}>{CATEGORIES[item.category] || item.category}</span>
                        {trend === 'down' && <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#7FCCA6', fontWeight: 600 }}>↓ 比上次便宜</span>}
                        {trend === 'up' && <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#FF92AE', fontWeight: 600 }}>↑ 比上次貴</span>}
                      </div>
                    </div>
                    {price != null && (
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 13, fontWeight: 600, color: '#3D2A2A' }}>${price.toLocaleString()}</div>
                    )}
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#C4A8A8' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </>
          )}

          {pending.length > 0 && done.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, paddingLeft: 4, marginBottom: 8 }}>
              <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 15, color: '#7FCCA6', fontWeight: 700 }}>已購買 · {done.length}</span>
              <div style={{ flex: 1, height: 2, background: '#F5E6E0', borderRadius: 99 }} />
            </div>
          )}

          {/* Done */}
          {done.length > 0 && pending.length === 0 && (
            <div style={{ paddingLeft: 4, marginBottom: 8 }}>
              <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, color: '#7FCCA6', fontWeight: 700 }}>已購買 · {done.length}</span>
            </div>
          )}
          {done.map(item => (
            <div key={item.id} style={{
              background: '#FFFFFF', borderRadius: 16, padding: '10px 12px', marginBottom: 6,
              border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
              display: 'grid', gridTemplateColumns: '24px 1fr auto auto', gap: 10, alignItems: 'center',
              opacity: 0.65,
            }}>
              <button onClick={() => toggleDone(item)} style={{
                width: 22, height: 22, borderRadius: 999,
                background: '#7FCCA6', border: '2px solid #3D2A2A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="M5 12 L10 17 L19 7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div>
                <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 14, fontWeight: 600, textDecoration: 'line-through', color: '#7A5C5C' }}>{item.name}</div>
                <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 10, color: '#C4A8A8', marginTop: 2 }}>{CATEGORIES[item.category] || item.category}</div>
              </div>
              <button onClick={() => transferToExpense(item)} style={{
                fontFamily: "'Fredoka', system-ui", fontSize: 10, fontWeight: 700,
                padding: '4px 10px', borderRadius: 99,
                background: '#C8EBD9', border: '1.5px solid #3D2A2A', color: '#3D2A2A',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
              }}>記帳 <ArrowRight size={10} /></button>
              <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#C4A8A8' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
