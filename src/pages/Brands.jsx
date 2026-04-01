import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query, getCountFromServer } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2, Star, ChevronRight, Tag, Package, X } from 'lucide-react'

const LOCAL_ICONS = {
  'PS BUBU': '/huan_huan/brand-icons/ps_bubu.png',
  '毛掌醫學': '/huan_huan/brand-icons/maozhuang.png',
  '肉球世界': '/huan_huan/brand-icons/rouqiu.png',
  '貓有話說': '/huan_huan/brand-icons/maohuashuo.png',
}

function BrandAvatar({ brand, size = 'sm' }) {
  const icon = brand.iconUrl || LOCAL_ICONS[brand.name]
  const cls = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-14 h-14 text-lg'
  if (icon) return <img src={icon} alt={brand.name} className={`${cls} rounded-xl object-contain bg-white border border-[#B0D8EE] flex-shrink-0`} />
  return <div className={`${cls} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`} style={{ background: '#4AAFDC' }}>{brand.name?.[0] || '?'}</div>
}

export { BrandAvatar, LOCAL_ICONS }

export default function Brands() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(null) // null | 'choice' | 'pick-brand'

  async function load() {
    try {
      const q = query(collection(db, 'brands'), orderBy('name'))
      const snap = await getDocs(q)
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setBrands(list)

      const counts = {}
      await Promise.all(list.map(async b => {
        const cSnap = await getCountFromServer(collection(db, 'brands', b.id, 'products'))
        counts[b.id] = cSnap.data().count
      }))
      setProductCounts(counts)
    } catch (e) {
      console.error('brands load error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('確定要刪除這個品牌嗎？')) return
    await deleteDoc(doc(db, 'brands', id))
    setBrands(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">品牌管理</h1>
        <button
          onClick={() => setSheet('choice')}
          className="flex items-center gap-1 bg-[#4AAFDC] text-white text-sm font-semibold px-3 py-2 rounded-xl cursor-pointer active:opacity-80"
        >
          <Plus size={16} /> 新增
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-[#B0D8EE] animate-pulse" />)}
        </div>
      ) : brands.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title="還沒有品牌紀錄"
          description="記錄嬛嬛喜歡的品牌"
          action={
            <button onClick={() => navigate('/brands/new')} className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer">
              新增品牌
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {brands.map(brand => (
            <Card key={brand.id} className="px-4 py-3 flex items-center gap-3" onClick={() => navigate(`/brands/${brand.id}`)}>
              <BrandAvatar brand={brand} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A4F6E] truncate">{brand.name}</p>
                {productCounts[brand.id] > 0 && (
                  <span className="text-xs text-[#7BAEC8]">{productCounts[brand.id]} 個產品</span>
                )}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < (brand.rating || 0) ? 'fill-[#4AAFDC] text-[#4AAFDC]' : 'text-[#B0D8EE]'} />
                ))}
              </div>
              <button onClick={e => handleDelete(e, brand.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer ml-1">
                <Trash2 size={16} />
              </button>
              <ChevronRight size={16} className="text-[#B0D8EE]" />
            </Card>
          ))}
        </div>
      )}

      {/* Bottom Sheet */}
      {sheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setSheet(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl p-6 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-['Caveat'] text-lg font-bold text-[#1A4F6E]">
                {sheet === 'pick-brand' ? '選擇品牌' : '新增'}
              </p>
              <button onClick={() => setSheet(null)} className="text-[#B0D8EE] cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {sheet === 'choice' && (
              <>
                <button
                  onClick={() => { setSheet(null); navigate('/brands/new') }}
                  className="w-full flex items-center gap-4 bg-[#F2F9FC] rounded-2xl px-4 py-4 cursor-pointer active:opacity-80"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#4AAFDC] flex items-center justify-center flex-shrink-0">
                    <Tag size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#1A4F6E]">新增品牌</p>
                    <p className="text-xs text-[#7BAEC8]">新增一個品牌</p>
                  </div>
                </button>

                <button
                  onClick={() => brands.length > 0 ? setSheet('pick-brand') : navigate('/brands/new')}
                  className="w-full flex items-center gap-4 bg-[#F2F9FC] rounded-2xl px-4 py-4 cursor-pointer active:opacity-80"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#34D399] flex items-center justify-center flex-shrink-0">
                    <Package size={18} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-[#1A4F6E]">新增產品</p>
                    <p className="text-xs text-[#7BAEC8]">選擇品牌後新增產品</p>
                  </div>
                </button>
              </>
            )}

            {sheet === 'pick-brand' && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {brands.map(brand => (
                  <button
                    key={brand.id}
                    onClick={() => { setSheet(null); navigate(`/brands/${brand.id}/products/new`) }}
                    className="w-full flex items-center gap-3 bg-[#F2F9FC] rounded-2xl px-4 py-3 cursor-pointer active:opacity-80"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#4AAFDC] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {brand.name?.[0] || '?'}
                    </div>
                    <span className="text-sm font-semibold text-[#1A4F6E] truncate">{brand.name}</span>
                    <ChevronRight size={16} className="text-[#B0D8EE] ml-auto flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
