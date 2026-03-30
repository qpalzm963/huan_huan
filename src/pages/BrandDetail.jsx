import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, orderBy, query, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import PageHeader from '../components/PageHeader'
import { Plus, Trash2, Star } from 'lucide-react'

const CATEGORIES = { food: '食品', snack: '零食', litter: '貓砂', supplies: '用品' }
const CAT_COLORS = { food: '#4AAFDC', snack: '#F97316', litter: '#34D399', supplies: '#A78BFA' }

export default function BrandDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [brand, setBrand] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

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

  const color = CAT_COLORS[brand.category] || '#7BAEC8'

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={brand.name} />
      <div className="p-4 space-y-4">
        {/* Brand Info */}
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0" style={{ background: color }}>
            {brand.name?.[0] || '?'}
          </div>
          <div className="flex-1">
            <p className="font-['Caveat'] text-xl font-bold text-[#1A4F6E]">{brand.name}</p>
            <p className="text-xs text-[#7BAEC8]">{CATEGORIES[brand.category] || brand.category}</p>
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A4F6E] truncate">{p.name}</p>
                    {p.note && <p className="text-xs text-[#7BAEC8] truncate">{p.note}</p>}
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < (p.rating || 0) ? 'fill-[#4AAFDC] text-[#4AAFDC]' : 'text-[#B0D8EE]'} />
                    ))}
                  </div>
                  <button onClick={() => handleDeleteProduct(p.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer ml-1">
                    <Trash2 size={16} />
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
