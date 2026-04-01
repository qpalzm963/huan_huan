import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2 } from 'lucide-react'

const TABS = ['體重', '預防保健', '看診']
const TABS_EMOJI = ['⚖️', '💊', '🏥']
const PREVENTIVE_TYPES = ['vaccine', 'deworming_internal', 'deworming_external']
const PREVENTIVE_BADGE = {
  vaccine: { label: '疫苗', color: '#34D399' },
  deworming_internal: { label: '體內驅蟲', color: '#F59E0B' },
  deworming_external: { label: '體外驅蟲', color: '#C084FC' },
}

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.hl-page { background: #F5F0EB; min-height: 100%; padding: 20px 20px 48px; }
.hl-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.hl-title { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.hl-add { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 100px; border: none; cursor: pointer; }
.hl-add:active { opacity: 0.8; transform: scale(0.97); }
.hl-tabs { display: flex; gap: 6px; margin-bottom: 20px; background: rgba(255,255,255,0.55); border-radius: 16px; padding: 5px; border: 1px solid rgba(176,216,238,0.4); }
.hl-tab { flex: 1; padding: 9px 4px; border-radius: 12px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: #9BBDD0; cursor: pointer; transition: all 0.18s; white-space: nowrap; }
.hl-tab.active { background: #1A4F6E; color: #fff; box-shadow: 0 2px 8px rgba(26,79,110,0.2); }
.hl-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 15px; background: rgba(255,255,255,0.76); border-radius: 18px; margin-bottom: 7px; border: 1px solid rgba(176,216,238,0.4); backdrop-filter: blur(5px); }
.hl-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
.hl-body { flex: 1; min-width: 0; }
.hl-weight { font-family: 'Caveat', cursive; font-size: 28px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.hl-weight-unit { font-size: 14px; font-family: system-ui; color: #9BBDD0; font-weight: 500; margin-left: 2px; }
.hl-name { font-size: 14px; font-weight: 600; color: #1A4F6E; }
.hl-badge { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 100px; margin-left: 6px; }
.hl-next { font-size: 11px; font-weight: 600; margin-top: 4px; }
.hl-date { font-size: 11px; color: #9BBDD0; margin-top: 3px; }
.hl-visit-clinic { font-size: 14px; font-weight: 600; color: #1A4F6E; }
.hl-visit-reason { font-size: 12px; color: #7BAEC8; margin-top: 2px; }
.hl-del { color: #C8DDE8; background: none; border: none; cursor: pointer; padding: 5px; margin-left: auto; flex-shrink: 0; transition: color 0.15s; }
.hl-del:active { color: #F87171; }
.hl-empty { text-align: center; padding: 64px 0; }
.hl-empty-icon { font-size: 48px; margin-bottom: 14px; }
.hl-empty-text { font-size: 14px; color: #9BBDD0; margin-bottom: 22px; font-weight: 500; }
.skel { background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 18px; height: 68px; margin-bottom: 7px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.3s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

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
    await deleteDoc(doc(db, 'health', id))
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const filtered = tab === 1
    ? records.filter(r => PREVENTIVE_TYPES.includes(r.type))
    : records.filter(r => r.type === ['weight', null, 'visit'][tab])

  return (
    <div className="hl-page">
      <style>{S}</style>

      <div className="hl-top">
        <div className="hl-title">健康紀錄</div>
        <button className="hl-add" onClick={() => navigate('/health/new')}>
          <Plus size={14} /> 新增
        </button>
      </div>

      <div className="hl-tabs">
        {TABS.map((t, i) => (
          <button key={t} className={`hl-tab${tab === i ? ' active' : ''}`} onClick={() => setTab(i)}>
            {TABS_EMOJI[i]} {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div>{[1, 2, 3].map(i => <div key={i} className="skel" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="hl-empty">
          <div className="hl-empty-icon">{TABS_EMOJI[tab]}</div>
          <div className="hl-empty-text">還沒有{TABS[tab]}紀錄</div>
          <button className="hl-add" onClick={() => navigate('/health/new')} style={{ margin: '0 auto' }}>
            新增紀錄
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {filtered.map(r => {
            const dotColor = r.type === 'weight' ? '#4AAFDC'
              : r.type === 'visit' ? '#F87171'
              : (PREVENTIVE_BADGE[r.type]?.color || '#9BBDD0')
            return (
              <div key={r.id} className="hl-card">
                <div className="hl-dot" style={{ background: dotColor }} />
                <div className="hl-body">
                  {r.type === 'weight' && (
                    <>
                      <div className="hl-weight">{r.weight}<span className="hl-weight-unit">kg</span></div>
                      {r.note && <div className="hl-date">{r.date} · {r.note}</div>}
                      {!r.note && <div className="hl-date">{r.date}</div>}
                    </>
                  )}
                  {PREVENTIVE_TYPES.includes(r.type) && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="hl-name">{r.name}</span>
                        <span
                          className="hl-badge"
                          style={{ background: (PREVENTIVE_BADGE[r.type]?.color || '#9BBDD0') + '22', color: PREVENTIVE_BADGE[r.type]?.color }}
                        >
                          {PREVENTIVE_BADGE[r.type]?.label}
                        </span>
                      </div>
                      {r.nextDate && (
                        <div className="hl-next" style={{ color: PREVENTIVE_BADGE[r.type]?.color }}>
                          下次：{r.nextDate}
                        </div>
                      )}
                      <div className="hl-date">{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                    </>
                  )}
                  {r.type === 'visit' && (
                    <>
                      <div className="hl-visit-clinic">{r.clinic}</div>
                      {r.reason && <div className="hl-visit-reason">{r.reason}</div>}
                      <div className="hl-date">{r.date}{r.note ? ` · ${r.note}` : ''}</div>
                    </>
                  )}
                </div>
                <button className="hl-del" onClick={() => handleDelete(r.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
