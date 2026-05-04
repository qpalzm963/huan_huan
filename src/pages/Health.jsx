import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { Plus, Trash2 } from 'lucide-react'

const TABS = [
  { k: 'weight',     label: '體重', sub: 'WT',     col: '#FFC8D6' },
  { k: 'preventive', label: '保健', sub: 'CARE',   col: '#C8EBD9' },
  { k: 'litter',     label: '貓砂', sub: 'LITTER', col: '#FFE4A0' },
  { k: 'visit',      label: '醫療', sub: 'VET',    col: '#E0CFF2' },
  { k: 'anomaly',    label: '異常', sub: 'ALERT',  col: '#FFD4B0' },
]
const PREVENTIVE_TYPES = ['vaccine', 'deworming_internal', 'deworming_external']
const PREVENTIVE_LABEL = { vaccine: '疫苗', deworming_internal: '體內驅蟲', deworming_external: '體外驅蟲' }
const LITTER_TYPES = ['litter_large', 'litter_small']
const LITTER_LABEL = { litter_large: '大貓砂盆', litter_small: '小貓砂盆' }
const SEVERITY_LABEL = { mild: '輕微', moderate: '中等', severe: '嚴重' }

export default function Health() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(query(collection(db, 'health'), orderBy('date', 'desc')))
      .then(snap => setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除？')) return
    const r = records.find(x => x.id === id)
    if (r?.type === 'anomaly' && r?.photos?.length > 0) {
      await Promise.all(r.photos.map(p => deleteObject(storageRef(storage, p.path)).catch(() => {})))
    }
    await deleteDoc(doc(db, 'health', id))
    setRecords(prev => prev.filter(x => x.id !== id))
  }

  const filtered = (() => {
    const k = TABS[tab].k
    if (k === 'preventive') return records.filter(r => PREVENTIVE_TYPES.includes(r.type))
    if (k === 'litter') return records.filter(r => LITTER_TYPES.includes(r.type))
    return records.filter(r => r.type === k)
  })()

  return (
    <div style={{ padding: '4px 14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 14px' }}>
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>health log ♡</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 26, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 2 }}>
            健康紀錄
          </div>
        </div>
        <button onClick={() => navigate('/health/new')} style={{
          background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A',
          padding: '8px 14px', borderRadius: 999, fontFamily: "'Fredoka', system-ui", fontWeight: 700, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          boxShadow: '0 3px 0 #7FCCA6',
        }}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {/* Tabs — sticker style */}
      <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', borderRadius: 18, padding: 4, border: '2px solid #3D2A2A', boxShadow: '0 3px 0 #3D2A2A' }}>
        {TABS.map((t, i) => (
          <button key={t.k} onClick={() => setTab(i)} style={{
            flex: 1, border: 'none', padding: '8px 4px', borderRadius: 12,
            background: tab === i ? t.col : 'transparent',
            color: '#3D2A2A',
            fontFamily: "'Fredoka', system-ui", fontWeight: 600, fontSize: 12, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            transition: 'all 0.18s',
            border: tab === i ? '1.5px solid #3D2A2A' : '1.5px solid transparent',
          }}>
            <span>{t.label}</span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 8, letterSpacing: '0.1em', opacity: 0.55 }}>{t.sub}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height: 70, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 18, marginBottom: 8, opacity: 0.6 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px' }}>
            <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600, color: '#3D2A2A', marginBottom: 6 }}>還沒有紀錄</div>
            <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600, marginBottom: 12 }}>♡ 來記第一筆吧</div>
            <button onClick={() => navigate('/health/new')} style={{
              background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A', padding: '10px 18px', borderRadius: 999,
              fontFamily: "'Fredoka', system-ui", fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 3px 0 #7FCCA6',
            }}>＋ 新增第一筆</button>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} style={{
              background: '#FFFFFF', borderRadius: 18, padding: '12px 14px', marginBottom: 8,
              border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-start',
            }}>
              <div style={{ minWidth: 0 }}>
                {r.type === 'weight' && (
                  <>
                    <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 30, lineHeight: 1, fontWeight: 700, color: '#3D2A2A' }}>
                      {r.weight}<span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 13, color: '#7A5C5C', marginLeft: 4, fontWeight: 500 }}>kg</span>
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#C4A8A8', marginTop: 6, letterSpacing: '0.1em' }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {PREVENTIVE_TYPES.includes(r.type) && (
                  <>
                    <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A' }}>{r.name}</div>
                    <div style={{
                      display: 'inline-block', marginTop: 4,
                      fontFamily: "'Fredoka', system-ui", fontSize: 10, fontWeight: 600,
                      padding: '2px 8px', borderRadius: 99,
                      background: '#C8EBD9', color: '#3D2A2A',
                      border: '1.5px solid #3D2A2A',
                    }}>{PREVENTIVE_LABEL[r.type]}</div>
                    {r.nextDate && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: '#7FCCA6', fontWeight: 600, marginTop: 4 }}>♡ 下次 · {r.nextDate}</div>}
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#C4A8A8', marginTop: 4 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {LITTER_TYPES.includes(r.type) && (
                  <>
                    <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A' }}>更換{LITTER_LABEL[r.type]}</div>
                    {r.nextDate && <div style={{ fontFamily: "'Caveat', cursive", fontSize: 14, color: '#F5C04D', fontWeight: 600, marginTop: 4 }}>♡ 下次 · {r.nextDate}</div>}
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#C4A8A8', marginTop: 4 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {r.type === 'visit' && (
                  <>
                    <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A' }}>{r.clinic}</div>
                    {r.reason && <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 12, color: '#7A5C5C', marginTop: 2 }}>{r.reason}</div>}
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#C4A8A8', marginTop: 4 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {r.type === 'anomaly' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 16, fontWeight: 600, color: '#3D2A2A' }}>{r.symptom}</span>
                      {r.severity && (
                        <span style={{
                          fontFamily: "'Fredoka', system-ui", fontSize: 10, fontWeight: 600,
                          padding: '2px 8px', borderRadius: 99,
                          background: '#FFD4B0', color: '#3D2A2A',
                          border: '1.5px solid #3D2A2A',
                        }}>{SEVERITY_LABEL[r.severity]}</span>
                      )}
                    </div>
                    {r.photos?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {r.photos.map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noreferrer">
                            <img src={p.url} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover', border: '1.5px solid #3D2A2A' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#C4A8A8', marginTop: 6 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
              </div>
              <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#C4A8A8', cursor: 'pointer', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
