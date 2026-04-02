import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import { Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react'

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.ph-page { background: #F5F0EB; min-height: 100%; padding: 20px 20px 48px; }
.ph-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.ph-title { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.ph-add { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 100px; border: none; cursor: pointer; }
.ph-add:active { opacity: 0.8; transform: scale(0.97); }

/* Tag filter */
.ph-tags { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; margin-bottom: 16px; scrollbar-width: none; }
.ph-tags::-webkit-scrollbar { display: none; }
.ph-tag { display: inline-flex; align-items: center; padding: 5px 12px; border-radius: 100px; font-size: 11px; font-weight: 700; white-space: nowrap; border: none; cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent; }
.ph-tag.all { background: rgba(255,255,255,0.7); color: #7BAEC8; border: 1px solid rgba(176,216,238,0.5); }
.ph-tag.all.active { background: #1A4F6E; color: #fff; border-color: #1A4F6E; }
.ph-tag.item { background: rgba(255,255,255,0.6); color: #7BAEC8; border: 1px solid rgba(176,216,238,0.4); }
.ph-tag.item.active { background: #4AAFDC; color: #fff; border-color: #4AAFDC; }
.ph-tag:active { transform: scale(0.93); }

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
.lb { position: fixed; inset: 0; background: rgba(10,12,18,0.95); z-index: 50; display: flex; flex-direction: column; user-select: none; }
.lb-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; flex-shrink: 0; }
.lb-lb-title { color: #fff; font-family: 'Caveat', cursive; font-size: 22px; font-weight: 700; line-height: 1.2; }
.lb-date { color: rgba(255,255,255,0.45); font-size: 12px; margin-top: 2px; }
.lb-btns { display: flex; gap: 6px; align-items: center; }
.lb-btn { background: rgba(255,255,255,0.1); border: none; border-radius: 10px; cursor: pointer; color: rgba(255,255,255,0.6); padding: 8px; display: flex; align-items: center; justify-content: center; transition: background 0.15s; }
.lb-btn:active { background: rgba(255,255,255,0.2); color: #fff; }
.lb-btn.danger:active { background: rgba(248,113,113,0.25); color: #F87171; }
.lb-body { flex: 1; display: flex; align-items: center; justify-content: center; position: relative; min-height: 0; }
.lb-img-wrap { flex: 1; display: flex; align-items: center; justify-content: center; padding: 0 56px; height: 100%; }
.lb-img-wrap img { max-width: 100%; max-height: 100%; border-radius: 16px; object-fit: contain; transition: opacity 0.18s; }
.lb-img-wrap img.switching { opacity: 0; }
.lb-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.12); border: none; border-radius: 12px; padding: 10px 8px; cursor: pointer; color: rgba(255,255,255,0.7); display: flex; align-items: center; transition: background 0.15s; }
.lb-nav:active { background: rgba(255,255,255,0.25); }
.lb-nav.prev { left: 8px; }
.lb-nav.next { right: 8px; }
.lb-nav:disabled { opacity: 0.2; cursor: default; }
.lb-footer { padding: 10px 20px 20px; flex-shrink: 0; }
.lb-note { color: rgba(255,255,255,0.45); font-size: 13px; text-align: center; line-height: 1.5; margin-bottom: 8px; }
.lb-photo-tags { display: flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
.lb-photo-tag { font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 100px; background: rgba(74,175,220,0.2); color: rgba(74,175,220,0.9); }
.lb-counter { text-align: center; font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 6px; }
`

export default function Photos() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lbIndex, setLbIndex] = useState(null)     // index into flatPhotos
  const [switching, setSwitching] = useState(false) // fade animation
  const [activeTag, setActiveTag] = useState(null)  // null = all
  const touchStartX = useRef(null)

  useEffect(() => {
    getDocs(query(collection(db, 'photos'), orderBy('createdAt', 'desc')))
      .then(snap => setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }, [])

  // Collect all unique tags
  const allTags = [...new Set(photos.flatMap(p => p.tags ?? []))].sort()

  // Filtered photo list
  const filtered = activeTag ? photos.filter(p => (p.tags ?? []).includes(activeTag)) : photos

  // Flat array for lightbox navigation (matches display order)
  const flatPhotos = filtered

  async function handleDelete(photo) {
    if (!confirm(`確定要刪除「${photo.title || '這張照片'}」嗎？`)) return
    await deleteDoc(doc(db, 'photos', photo.id))
    if (photo.path) { try { await deleteObject(ref(storage, photo.path)) } catch {} }
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    setLbIndex(null)
  }

  function openLightbox(photo) {
    const idx = flatPhotos.findIndex(p => p.id === photo.id)
    setLbIndex(idx >= 0 ? idx : 0)
  }

  function navigateLb(dir) {
    if (switching) return
    const next = lbIndex + dir
    if (next < 0 || next >= flatPhotos.length) return
    setSwitching(true)
    setTimeout(() => {
      setLbIndex(next)
      setSwitching(false)
    }, 160)
  }

  // Touch swipe handlers
  function onTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchStartX.current === null) return
    const dx = touchStartX.current - e.changedTouches[0].clientX
    touchStartX.current = null
    if (Math.abs(dx) < 50) return
    navigateLb(dx > 0 ? 1 : -1)
  }

  // Group filtered photos by month
  const groups = filtered.reduce((acc, p) => {
    const m = p.date?.slice(0, 7) || 'unknown'
    if (!acc[m]) acc[m] = []
    acc[m].push(p)
    return acc
  }, {})

  const lbPhoto = lbIndex !== null ? flatPhotos[lbIndex] : null

  return (
    <div className="ph-page">
      <style>{S}</style>

      <div className="ph-top">
        <div className="ph-title">照片日記</div>
        <button className="ph-add" onClick={() => navigate('/photos/new')}>
          <Plus size={14} /> 新增
        </button>
      </div>

      {/* Tag filter */}
      {!loading && allTags.length > 0 && (
        <div className="ph-tags">
          <button
            className={`ph-tag all${activeTag === null ? ' active' : ''}`}
            onClick={() => setActiveTag(null)}
          >
            全部
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`ph-tag item${activeTag === tag ? ' active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="skel-grid">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skel" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="ph-empty">
          <div className="ph-empty-icon">{activeTag ? '🔍' : '🌿'}</div>
          <div className="ph-empty-text">
            {activeTag ? `沒有「${activeTag}」標籤的照片` : '還沒有照片\n記錄嬛嬛的美好時刻'}
          </div>
          {!activeTag && (
            <button className="ph-add" onClick={() => navigate('/photos/new')} style={{ margin: '0 auto' }}>
              上傳第一張
            </button>
          )}
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
                    <div key={p.id} className="ph-cell" onClick={() => openLightbox(p)}>
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

      {/* Lightbox */}
      {lbPhoto && (
        <div
          className="lb"
          onClick={() => setLbIndex(null)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Top bar */}
          <div className="lb-bar" onClick={e => e.stopPropagation()}>
            <div>
              <div className="lb-lb-title">{lbPhoto.title || '照片'}</div>
              {lbPhoto.date && <div className="lb-date">{lbPhoto.date}</div>}
            </div>
            <div className="lb-btns">
              <button className="lb-btn danger" onClick={() => handleDelete(lbPhoto)}>
                <Trash2 size={17} />
              </button>
              <button className="lb-btn" onClick={() => setLbIndex(null)}>
                <X size={19} />
              </button>
            </div>
          </div>

          {/* Image + nav arrows */}
          <div className="lb-body" onClick={e => e.stopPropagation()}>
            <button
              className="lb-nav prev"
              disabled={lbIndex === 0}
              onClick={() => navigateLb(-1)}
            >
              <ChevronLeft size={22} />
            </button>
            <div className="lb-img-wrap">
              <img
                src={lbPhoto.url}
                alt={lbPhoto.title}
                className={switching ? 'switching' : ''}
              />
            </div>
            <button
              className="lb-nav next"
              disabled={lbIndex === flatPhotos.length - 1}
              onClick={() => navigateLb(1)}
            >
              <ChevronRight size={22} />
            </button>
          </div>

          {/* Footer */}
          <div className="lb-footer" onClick={e => e.stopPropagation()}>
            {lbPhoto.note && <div className="lb-note">{lbPhoto.note}</div>}
            {(lbPhoto.tags ?? []).length > 0 && (
              <div className="lb-photo-tags">
                {lbPhoto.tags.map(tag => (
                  <span key={tag} className="lb-photo-tag">{tag}</span>
                ))}
              </div>
            )}
            <div className="lb-counter">{lbIndex + 1} / {flatPhotos.length}</div>
          </div>
        </div>
      )}
    </div>
  )
}
