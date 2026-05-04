import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref as storageRef, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { Plus, Trash2 } from 'lucide-react'

const TABS = [
  { k: 'weight', label: '體重', sub: 'WT' },
  { k: 'preventive', label: '保健', sub: 'CARE' },
  { k: 'litter', label: '貓砂', sub: 'LITTER' },
  { k: 'visit', label: '醫療', sub: 'VET' },
  { k: 'anomaly', label: '異常', sub: 'ALERT' },
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
    <div style={{ padding: '8px 16px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 6px 14px' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em', color: '#B5A3A3' }}>SECTION · 健</div>
          <div style={{ fontFamily: 'Quicksand', fontSize: 26, color: '#3A2E2E', letterSpacing: '-0.01em', marginTop: 2 }}>
            <span style={{ }}>健康</span> 紀錄
          </div>
        </div>
        <button onClick={() => navigate('/health/new')} style={{
          background: '#3A2E2E', color: '#FBF6F1', border: 'none',
          padding: '8px 14px', borderRadius: 999, fontFamily: 'Nunito', fontWeight: 600, fontSize: 12,
          display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
        }}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#FFFFFF', borderRadius: 18, padding: 4, boxShadow: '0 2px 8px rgba(58,46,46,0.04)' }}>
        {TABS.map((t, i) => (
          <button key={t.k} onClick={() => setTab(i)} style={{
            flex: 1, border: 'none', padding: '8px 4px', borderRadius: 14,
            background: tab === i ? '#3A2E2E' : 'transparent',
            color: tab === i ? '#FBF6F1' : '#6E5A5A',
            fontFamily: 'Nunito', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
            transition: 'all 0.18s',
          }}>
            <span>{t.label}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 8, letterSpacing: '0.1em', opacity: 0.55 }}>{t.sub}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height: 70, background: '#FFFFFF', borderRadius: 22, marginBottom: 8, opacity: 0.6 }} />)
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 16px' }}>
            <div style={{ fontFamily: 'Quicksand', fontSize: 18, color: '#6E5A5A', marginBottom: 12 }}>還沒有紀錄</div>
            <button onClick={() => navigate('/health/new')} style={{
              background: '#3A2E2E', color: '#FBF6F1', border: 'none', padding: '10px 18px', borderRadius: 999,
              fontFamily: 'Nunito', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>＋ 新增第一筆</button>
          </div>
        ) : (
          filtered.map(r => (
            <div key={r.id} style={{
              background: '#FFFFFF', borderRadius: 20, padding: '14px 16px', marginBottom: 8,
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'flex-start',
              boxShadow: '0 2px 8px rgba(58,46,46,0.04)',
            }}>
              <div style={{ minWidth: 0 }}>
                {r.type === 'weight' && (
                  <>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 32, lineHeight: 1, color: '#3A2E2E', fontWeight: 400 }}>
                      {r.weight}<span style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: '#B5A3A3', marginLeft: 4 }}>kg</span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', marginTop: 6, letterSpacing: '0.1em' }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {PREVENTIVE_TYPES.includes(r.type) && (
                  <>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 17, fontWeight: 500, color: '#3A2E2E' }}>{r.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9.5, color: 'oklch(0.78 0.06 25)', letterSpacing: '0.12em', marginTop: 3 }}>{PREVENTIVE_LABEL[r.type]?.toUpperCase()}</div>
                    {r.nextDate && <div style={{ fontFamily: 'Nunito', fontSize: 12, color: 'oklch(0.78 0.06 25)', marginTop: 4 }}>下次 · {r.nextDate}</div>}
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', marginTop: 4 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {LITTER_TYPES.includes(r.type) && (
                  <>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 17, fontWeight: 500, color: '#3A2E2E' }}>更換{LITTER_LABEL[r.type]}</div>
                    {r.nextDate && <div style={{ fontFamily: 'Nunito', fontSize: 12, color: '#6E5A5A', marginTop: 4 }}>下次 · {r.nextDate}</div>}
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', marginTop: 4 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {r.type === 'visit' && (
                  <>
                    <div style={{ fontFamily: 'Quicksand', fontSize: 17, fontWeight: 500, color: '#3A2E2E' }}>{r.clinic}</div>
                    {r.reason && <div style={{ fontFamily: 'Nunito', fontSize: 12, color: '#6E5A5A', marginTop: 2 }}>{r.reason}</div>}
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', marginTop: 4 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
                {r.type === 'anomaly' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'Quicksand', fontSize: 16, fontWeight: 500, color: '#3A2E2E' }}>{r.symptom}</span>
                      {r.severity && (
                        <span style={{
                          fontFamily: 'JetBrains Mono', fontSize: 9, letterSpacing: '0.1em',
                          padding: '2px 7px', borderRadius: 999,
                          background: 'oklch(0.78 0.06 25 / 0.15)', color: 'oklch(0.78 0.06 25)',
                        }}>{SEVERITY_LABEL[r.severity]?.toUpperCase()}</span>
                      )}
                    </div>
                    {r.photos?.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {r.photos.map((p, i) => (
                          <a key={i} href={p.url} target="_blank" rel="noreferrer">
                            <img src={p.url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover' }} />
                          </a>
                        ))}
                      </div>
                    )}
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#B5A3A3', marginTop: 6 }}>{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                  </>
                )}
              </div>
              <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#D8C8C8', cursor: 'pointer', padding: 4 }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
