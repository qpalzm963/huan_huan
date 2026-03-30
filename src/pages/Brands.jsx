import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import Card from '../components/Card'
import EmptyState from '../components/EmptyState'
import { Plus, Trash2, Star } from 'lucide-react'

const CATEGORIES = { food: '食品', snack: '零食', litter: '貓砂', supplies: '用品' }
const CAT_COLORS = { food: '#4AAFDC', snack: '#F97316', litter: '#34D399', supplies: '#A78BFA' }

export default function Brands() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const q = query(collection(db, 'brands'), orderBy('category'))
    const snap = await getDocs(q)
    setBrands(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('確定要刪除這個品牌嗎？')) return
    await deleteDoc(doc(db, 'brands', id))
    setBrands(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-['Caveat'] text-2xl font-bold text-[#1A4F6E]">品牌管理</h1>
        <button
          onClick={() => navigate('/brands/new')}
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
            <button
              onClick={() => navigate('/brands/new')}
              className="bg-[#4AAFDC] text-white px-5 py-2 rounded-xl font-semibold text-sm cursor-pointer"
            >
              新增品牌
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {brands.map(brand => (
            <Card key={brand.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: CAT_COLORS[brand.category] || '#7BAEC8' }}>
                {brand.name?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1A4F6E] truncate">{brand.name}</p>
                <p className="text-xs text-[#7BAEC8]">{CATEGORIES[brand.category] || brand.category}</p>
                {brand.note && <p className="text-xs text-[#7BAEC8] truncate">{brand.note}</p>}
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < (brand.rating || 0) ? 'fill-[#4AAFDC] text-[#4AAFDC]' : 'text-[#B0D8EE]'}
                  />
                ))}
              </div>
              <button onClick={() => handleDelete(brand.id)} className="text-[#B0D8EE] hover:text-[#F87171] transition-colors cursor-pointer ml-1">
                <Trash2 size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
