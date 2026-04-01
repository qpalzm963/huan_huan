import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { Plus, Trash2, X } from 'lucide-react'

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.ph-page { background: #F5F0EB; min-height: 100%; padding: 20px 20px 48px; }
.ph-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.ph-title { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.ph-add { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 100px; border: none; cursor: pointer; }
.ph-add:active { opacity: 0.8; transform: scale(0.97); }
.ph-month-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; color: #9BBDD0; text-transform: uppercase; margin-bottom: 8px; margin-top: 4px; }
.ph-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; margin-bottom: 18px; }
.ph-cell { aspect-ratio: 1; border-radius: 14px; overflow: hidden; cursor: pointer; background: rgba(176,216,238,0.25); position: relative; }
.ph-cell img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.2s; display: block; }
.ph-cell:active img { transform: scale(0.95); }
.ph-cell-date { position: absolute; bottom: 0; left: 0; right: 0; padding: 4px 7px; font-size: 9px; color: rgba(255,255,255,0.92); font-weight: 600; background: linear-gradient(transparent, rgba(0,0,0,0.38)); letter-spacing: 0.04em; }
.ph-empty { text-align: center; padding: 80px 0; }
.ph-empty-icon { font-size: 52px; margin-bottom: 14px; }
.ph-empty-text { font-size: 14px; color: #9BBDD0; margin-bottom: 22px; font-weight: 500; }
.skel-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px; }
.skel { aspect-ratio: 1; border-radius: 14px; background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* Lightbox */
.lb { position: fixed; inset: 0; background: rgba(10,12,18,0.94); z-index: 50; display: flex; flex-direction: column; }
.lb-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
.lb-info {}
.lb-lb-title { color: #fff; font-family: 'Caveat', cursive; font-size: 22px; font-weight: 700; line-height: 1.2; }
.lb-date { color: rgba(255,255,255,0.45); font-size: 12px; margin-top: 2px; }
.lb-btns { display: flex; gap: 6px; align-items: center; }
.lb-btn { background: rgba(255,255,255,0.1); border: none; border-radius: 10px; cursor: pointer; color: rgba(255,255,255,0.6); padding: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
.lb-btn:active { background: rgba(255,255,255,0.2); color: #fff; }
.lb-btn.danger:active { background: rgba(248,113,113,0.25); color: #F87171; }
.lb-img-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 8px 20px; }
.lb-img-wrap img { max-width: 100%; max-height: 100%; border-radius: 16px; object-fit: contain; }
.lb-note { color: rgba(255,255,255,0.45); font-size: 13px; text-align: center; padding: 12px 24px 24px; line-height: 1.5; }
`

export default function Photos() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc')))
      .then(snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(photo) {
    if (!confirm(`確定要刪除「${photo.title || '這張照片'}」嗎？`)) return
    await deleteDoc(doc(db, 'photos', photo.id))
    if (photo.path) { try { await deleteObject(ref(storage, photo.path)) } catch {} }
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    if (lightbox?.id === photo.id) setLightbox(null)
  }

  // Group by month
  const groups = photos.reduce((acc, p) => {
    const m = p.date?.slice(0, 7) || 'unknown'
    if (!acc[m]) acc[m] = []
    acc[m].push(p)
    return acc
  }, {})

  return (
    <div className="ph-page">
      <style>{S}</style>

      <div className="ph-top">
        <div className="ph-title">照片日記</div>
        <button className="ph-add" onClick={() => navigate('/photos/new')}>
          <Plus size={14} /> 新增
        </button>
      </div>

      {loading ? (
        <div className="skel-grid">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skel" />)}</div>
      ) : photos.length === 0 ? (
        <div className="ph-empty">
          <div className="ph-empty-icon">🌿</div>
          <div className="ph-empty-text">還沒有照片<br />記錄嬛嬛的美好時刻</div>
          <button className="ph-add" onClick={() => navigate('/photos/new')} style={{ margin: '0 auto' }}>
            上傳第一張
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {Object.entries(groups).map(([month, items]) => {
            const [y, m] = month.split('-')
            const label = m ? `${y}年${parseInt(m)}月` : '未知日期'
            return (
              <div key={month}>
                <div className="ph-month-lbl">{label} · {items.length}張</div>
                <div className="ph-grid">
                  {items.map(p => (
                    <div key={p.id} className="ph-cell" onClick={() => setLightbox(p)}>
                      <img src={p.url} alt={p.title} loading="lazy" />
                      {p.date && <div className="ph-cell-date">{p.date?.slice(5)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {lightbox && (
        <div className="lb" onClick={() => setLightbox(null)}>
          <div className="lb-bar" onClick={e => e.stopPropagation()}>
            <div className="lb-info">
              <div className="lb-lb-title">{lightbox.title || '照片'}</div>
              {lightbox.date && <div className="lb-date">{lightbox.date}</div>}
            </div>
            <div className="lb-btns">
              <button className="lb-btn danger" onClick={() => handleDelete(lightbox)}>
                <Trash2 size={17} />
              </button>
              <button className="lb-btn" onClick={() => setLightbox(null)}>
                <X size={19} />
              </button>
            </div>
          </div>
          <div className="lb-img-wrap" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.title} />
          </div>
          {lightbox.note && (
            <div className="lb-note" onClick={e => e.stopPropagation()}>{lightbox.note}</div>
          )}
        </div>
      )}
    </div>
  )
}
