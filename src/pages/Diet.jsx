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
    <div style={{ padding: '4px 14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 14px' }}>
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>diet log ♡</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 26, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 2 }}>
            飲食日誌
          </div>
        </div>
        <button onClick={() => navigate('/diet/new')} style={{
          background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A',
          padding: '8px 14px', borderRadius: 999,
          fontFamily: "'Fredoka', system-ui", fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          boxShadow: '0 3px 0 #7FCCA6',
        }}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {loading ? (
        <div>{[1,2,3].map(i => <div key={i} style={{ height: 80, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 18, marginBottom: 8, opacity: 0.6 }} />)}</div>
      ) : records.length === 0 ? (
        <EmptyState
          icon="🍽️"
          title="還沒有飲食紀錄"
          description="記錄嬛嬛今天吃了什麼"
          action={
            <button onClick={() => navigate('/diet/new')} style={{
              background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A',
              padding: '10px 20px', borderRadius: 999, fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 3px 0 #7FCCA6',
            }}>新增紀錄</button>
          }
        />
      ) : (
        <div>
          {records.map(r => {
            const [y, mo, d] = (r.date || '').split('-')
            return (
              <div key={r.id} style={{
                background: '#FFFFFF', borderRadius: 18, padding: 12, marginBottom: 8,
                border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
                display: 'grid', gridTemplateColumns: '46px 1fr auto', gap: 12,
              }}>
                <div style={{
                  background: '#FFE4A0', borderRadius: 14, padding: '6px 0',
                  border: '1.5px solid #3D2A2A',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 22, lineHeight: 1, fontWeight: 700, color: '#3D2A2A' }}>{d || '—'}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 8, letterSpacing: '0.1em', color: '#7A5C5C', marginTop: 2 }}>{mo ? `${parseInt(mo)}月` : ''}</div>
                </div>
                <div>
                  {r.morning && (
                    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'baseline' }}>
                      <span style={{ fontFamily: "'Caveat', cursive", fontSize: 14, fontWeight: 600, color: '#FFA877' }}>AM</span>
                      <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 600, color: '#3D2A2A' }}>{r.morning}</span>
                      {r.morningAmount && <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 11, color: '#7A5C5C' }}>{r.morningAmount}g</span>}
                    </div>
                  )}
                  {r.evening && (
                    <div style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 8, alignItems: 'baseline', marginTop: 3 }}>
                      <span style={{ fontFamily: "'Caveat', cursive", fontSize: 14, fontWeight: 600, color: '#B594D9' }}>PM</span>
                      <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 600, color: '#3D2A2A' }}>{r.evening}</span>
                      {r.eveningAmount && <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 11, color: '#7A5C5C' }}>{r.eveningAmount}g</span>}
                    </div>
                  )}
                  {r.note && (
                    <div style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: '#7A5C5C', fontWeight: 500, marginTop: 4 }}>♡ {r.note}</div>
                  )}
                </div>
                <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#C4A8A8', cursor: 'pointer', padding: 4, alignSelf: 'flex-start' }}>
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
