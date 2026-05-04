import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2 } from 'lucide-react'

export default function Diet() {
  const navigate = useNavigate()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'diet'), orderBy('date', 'desc')))
      .then(snap => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    await deleteDoc(doc(db, 'diet', id))
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 6px 14px' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em', color: '#B5A3A3' }}>SECTION · 食</div>
          <div style={{ fontFamily: 'Quicksand', fontSize: 26, color: '#3A2E2E', letterSpacing: '-0.01em', marginTop: 2 }}>
            <span style={{ }}>飲食</span> 日誌
          </div>
        </div>
        <button onClick={() => navigate('/diet/new')} style={{
          background: '#3A2E2E', color: '#FBF6F1', border: 'none',
          padding: '8px 14px', borderRadius: 999,
          fontFamily: 'Nunito', fontWeight: 600, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        }}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {loading ? (
        <div>{[1,2,3].map(i => <div key={i} style={{ height: 80, background: '#FFFFFF', borderRadius: 22, marginBottom: 8, opacity: 0.6 }} />)}</div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="還沒有飲食紀錄"
          description="記錄嬛嬛今天吃了什麼"
          action={
            <button onClick={() => navigate('/diet/new')} style={{
              background: '#3A2E2E', color: '#FBF6F1', border: 'none',
              padding: '10px 20px', borderRadius: 999, fontFamily: 'Nunito', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>新增紀錄</button>
          }
        />
      ) : (
        <div>
          {records.map(r => {
            const [y, mo, d] = (r.date || '').split('-')
            return (
              <div key={r.id} style={{
                background: '#FFFFFF', borderRadius: 22, padding: 16, marginBottom: 8,
                display: 'grid', gridTemplateColumns: '52px 1fr auto', gap: 14,
                boxShadow: '0 2px 8px rgba(58,46,46,0.05)',
              }}>
                <div style={{
                  background: '#FBF6F1', borderRadius: 14, padding: '8px 0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                }}>
                  <div style={{ fontFamily: 'Quicksand', fontSize: 24, lineHeight: 1, color: '#3A2E2E' }}>{d || '—'}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, letterSpacing: '0.15em', color: '#B5A3A3', marginTop: 2 }}>{mo ? `${parseInt(mo)}月` : ''}</div>
                </div>
                <div>
                  {r.morning && (
                    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#B5A3A3' }}>AM</span>
                      <span style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 500, color: '#3A2E2E' }}>{r.morning}</span>
                      {r.morningAmount && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6E5A5A' }}>{r.morningAmount}g</span>}
                    </div>
                  )}
                  {r.evening && (
                    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'baseline', marginTop: 4 }}>
                      <span style={{ fontFamily: 'Quicksand', fontSize: 13, color: '#B5A3A3' }}>PM</span>
                      <span style={{ fontFamily: 'Nunito', fontSize: 14, fontWeight: 500, color: '#3A2E2E' }}>{r.evening}</span>
                      {r.eveningAmount && <span style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#6E5A5A' }}>{r.eveningAmount}g</span>}
                    </div>
                  )}
                  {r.note && (
                    <div style={{ fontFamily: 'Quicksand', fontSize: 12, color: '#6E5A5A', marginTop: 8 }}>“{r.note}”</div>
                  )}
                </div>
                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#D8C8C8', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
