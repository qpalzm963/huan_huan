import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2, X } from 'lucide-react'

export default function Photos() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)

  async function load() {
    setLoading(true)
    const q = query(collection(db, 'photos'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(photo) {
    if (!confirm(`確定要刪除「${photo.title || '這張照片'}」嗎？`)) return
    await deleteDoc(doc(db, 'photos', photo.id))
    if (photo.path) {
      try { await deleteObject(ref(storage, photo.path)) } catch {}
    }
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
    if (lightbox?.id === photo.id) setLightbox(null)
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">照片日記</h1>
        <button
          onClick={() => navigate('/photos/new')}
          className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="aspect-square rounded-xl bg-[#B0D8EE] animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon="📷"
          title="還沒有照片"
          action={
            <button
              onClick={() => navigate('/photos/new')}
              className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer"
            >
              上傳第一張
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(p => (
            <div
              key={p.id}
              onClick={() => setLightbox(p)}
              className="aspect-square rounded-xl overflow-hidden bg-[#F2F9FC] cursor-pointer active:opacity-80"
            >
              <img src={p.url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex flex-col"
          onClick={() => setLightbox(null)}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-2" onClick={e => e.stopPropagation()}>
            <div>
              {lightbox.title && <p className="text-white font-semibold text-sm">{lightbox.title}</p>}
              <p className="text-white/60 text-xs">{lightbox.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => handleDelete(lightbox)} className="text-white/60 hover:text-red-400 transition-colors cursor-pointer">
                <Trash2 size={20} />
              </button>
              <button onClick={() => setLightbox(null)} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                <X size={22} />
              </button>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.title} className="max-w-full max-h-full rounded-xl object-contain" />
          </div>
          {lightbox.note && (
            <p className="text-white/70 text-xs text-center px-4 pb-4" onClick={e => e.stopPropagation()}>
              {lightbox.note}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
