import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, orderBy, query, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { Plus, Trash2, Star, Camera, Pencil, ChartLine } from 'lucide-react'
import { BrandAvatar, LOCAL_ICONS } from './Brands'

const PROD_CATEGORIES = { food: '食品', snack: '零食', litter: '貓砂', supplies: '用品', health: '保健品' }
const PROD_CAT_COLORS = { food: '#4AAFDC', snack: '#F97316', litter: '#34D399', supplies: '#A78BFA', health: '#F59E0B' }

export default function BrandDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const iconRef = useRef(null)
  const [brand, setBrand] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingIcon, setUploadingIcon] = useState(false)

  async function handleIconUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingIcon(true)
    try {
      const ext = file.name.split('.').pop()
      const storageRef = ref(storage, `brands/${id}/icon.${ext}`)
      const task = uploadBytesResumable(storageRef, file)
      await new Promise((resolve, reject) => task.on('state_changed', null, reject, resolve))
      const url = await getDownloadURL(storageRef)
      await updateDoc(doc(db, 'brands', id), { iconUrl: url })
      setBrand(prev => ({ ...prev, iconUrl: url }))
    } catch (e) {
      console.error(e)
    } finally {
      setUploadingIcon(false)
    }
  }

  async function load() {
    const [brandSnap, prodSnap] = await Promise.all([
      getDoc(doc(db, 'brands', id)),
      getDocs(query(collection(db, 'brands', id, 'products'), orderBy('createdAt', 'desc')))
    ])
    if (brandSnap.exists()) setBrand({ id: brandSnap.id, ...brandSnap.data() })
    setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleDeleteProduct(pid) {
    if (!confirm('確定要刪除這個產品嗎？')) return
    await deleteDoc(doc(db, 'brands', id, 'products', pid))
    setProducts(prev => prev.filter(p => p.id !== pid))
  }

  if (loading) return (
    <div className="p-4 space-y-3">
      <div className="h-24 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />
      <div className="h-16 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />
    </div>
  )

  if (!brand) return <div className="p-4 text-[#7BAEC8]">找不到品牌</div>

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={brand.name} />
      <div className="p-4 space-y-4">
        {/* Brand Info */}
        <Card className="p-4 flex items-center gap-4">
          <div className="relative flex-shrink-0 cursor-pointer" onClick={() => iconRef.current.click()}>
            <BrandAvatar brand={brand} size="lg" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4AAFDC] rounded-full flex items-center justify-center">
              {uploadingIcon ? <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={11} className="text-white" />}
            </div>
            <input ref={iconRef} type="file" accept="image/*" className="hidden" onChange={handleIconUpload} />
          </div>
          <div className="flex-1">
            <p className="font-['Caveat'] text-xl font-bold text-[#1A4F6E]">{brand.name}</p>
            {brand.note && <p className="text-xs text-[#3A7EA0] mt-0.5">{brand.note}</p>}
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className={i < (brand.rating || 0) ? 'fill-[#4AAFDC] text-[#4AAFDC]' : 'text-[#B0D8EE]'} />
            ))}
          </div>
        </Card>

        {/* Products */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-['Caveat'] text-lg font-semibold text-[#1A4F6E]">產品列表</h2>
            <button
              onClick={() => navigate(`/brands/${id}/products/new`)}
              className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
            >
              <Plus size={14} /> 新增產品
            </button>
          </div>

          {products.length === 0 ? (
            <EmptyState
              icon="📦"
              title="還沒有產品"
              description="新增這個品牌下的具體產品"
              action={
                <button onClick={() => navigate(`/brands/${id}/products/new`)} className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer">
                  新增產品
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {products.map(p => (
                <Card key={p.id} className="px-4 py-3 flex items-center gap-3">
                  {p.url ? (
                    <img src={p.url} alt={p.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#F2F9FC] border border-[#B0D8EE] flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#1A4F6E] truncate">{p.name}</p>
                      {p.category && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: (PROD_CAT_COLORS[p.category] || '#7BAEC8') + '22', color: PROD_CAT_COLORS[p.category] || '#7BAEC8' }}>
                          {PROD_CATEGORIES[p.category] || p.category}
                        </span>
                      )}
                    </div>
                    {p.note && <p className="text-xs text-[#7BAEC8] truncate mt-0.5">{p.note}</p>}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={11} className={i < (p.rating || 0) ? 'fill-[#4AAFDC] text-[#4AAFDC]' : 'text-[#B0D8EE]'} />
                      ))}
                    </div>
                    {p.price != null && (
                      <p className="text-xs font-semibold text-[#4AAFDC] mt-0.5">${p.price.toLocaleString()}</p>
                    )}
                  </div>
                  <button onClick={() => navigate(`/brands/${id}/products/${p.id}/prices`)} className="text-[#B0D8EE] hover:text-[#4AAFDC] transition-colors cursor-pointer">
                    <ChartLine size={15} />
                  </button>
                  <button onClick={() => navigate(`/brands/${id}/products/${p.id}/edit`)} className="text-[#B0D8EE] hover:text-[#4AAFDC] transition-colors cursor-pointer">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDeleteProduct(p.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer">
                    <Trash2 size={15} />
                  </button>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
