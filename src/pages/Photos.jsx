import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import { db, storage } from '../firebase'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2, X } from 'lucide-react'

export default function Photos() {
  const navigate = useNavigate()
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  async function load() {
    const q = query(collection(db, 'photos'), orderBy('date', 'desc'))
    const snap = await getDocs(q)
    setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(photo) {
    if (!confirm('確定要刪除這張照片嗎？')) return
    try {
      if (photo.storagePath) {
        await deleteObject(ref(storage, photo.storagePath))
      }
      await deleteDoc(doc(db, 'photos', photo.id))
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      if (preview?.id === photo.id) setPreview(null)
    } catch (e) {
      console.error(e)
    }
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
          {[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-white rounded-xl border border-[#B0D8EE] animate-pulse" />)}
        </div>
      ) : photos.length === 0 ? (
        <EmptyState
          icon="📷"
          title="還沒有照片"
          description="記錄嬛嬛每一個可愛的瞬間"
          action={
            <button onClick={() => navigate('/photos/new')} className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer">
              新增照片
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <div key={photo.id} className="relative aspect-square" onClick={() => setPreview(photo)}>
              <img
                src={photo.url}
                alt={photo.title || '嬛嬛'}
                className="w-full h-full object-cover rounded-xl cursor-pointer"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <img src={preview.url} alt={preview.title} className="w-full object-cover max-h-80" />
            <div className="p-4">
              {preview.title && <p className="font-['Caveat'] text-lg font-bold text-[#1A4F6E]">{preview.title}</p>}
              <p className="text-xs text-[#7BAEC8]">{preview.date}</p>
              {preview.note && <p className="text-sm text-[#3A7EA0] mt-1">{preview.note}</p>}
              <div className="flex gap-2 mt-3">
                <button onClick={() => setPreview(null)} className="flex-1 py-2 border border-[#B0D8EE] rounded-xl text-sm text-[#7BAEC8] cursor-pointer">
                  關閉
                </button>
                <button onClick={() => handleDelete(preview)} className="flex items-center justify-center gap-1 px-4 py-2 bg-red-50 text-red-400 rounded-xl text-sm cursor-pointer">
                  <Trash2 size={14} /> 刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
