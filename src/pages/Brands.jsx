import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query, getCountFromServer } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, Star, ChevronRight, Tag, Package, X } from 'lucide-react'

const LOCAL_ICONS = {
  'PS BUBU': '/huan_huan/brand-icons/ps_bubu.png',
  '毛掌醫學': '/huan_huan/brand-icons/maozhuang.png',
  '肉球世界': '/huan_huan/brand-icons/rouqiu.png',
  '貓有話說': '/huan_huan/brand-icons/maohuashuo.png',
}

function BrandAvatar({ brand, size = 'sm' }) {
  const icon = brand.iconUrl || LOCAL_ICONS[brand.name]
  const sm = size === 'sm'
  const style = {
    width: sm ? 40 : 56,
    height: sm ? 40 : 56,
    borderRadius: 12,
    flexShrink: 0,
    objectFit: 'contain',
    background: '#fff',
    border: '1px solid rgba(176,216,238,0.5)',
  }
  if (icon) return <img src={icon} alt={brand.name} style={style} />
  return (
    <div style={{
      ...style,
      background: '#4AAFDC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontWeight: 700,
      fontSize: sm ? 14 : 20,
    }}>
      {brand.name?.[0] || '?'}
    </div>
  )
}

export { BrandAvatar, LOCAL_ICONS }

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.br-page { background: #F5F0EB; min-height: 100%; padding: 20px 20px 48px; }
.br-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.br-title { font-family: 'Caveat', cursive; font-size: 34px; font-weight: 700; color: #1A4F6E; line-height: 1; }
.br-add { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 13px; font-weight: 700; padding: 9px 18px; border-radius: 100px; border: none; cursor: pointer; }
.br-add:active { opacity: 0.8; transform: scale(0.97); }
.br-card { display: flex; align-items: center; gap: 12px; padding: 13px 15px; background: rgba(255,255,255,0.76); border-radius: 18px; margin-bottom: 7px; border: 1px solid rgba(176,216,238,0.4); backdrop-filter: blur(5px); cursor: pointer; transition: background 0.15s; }
.br-card:active { background: rgba(255,255,255,0.9); }
.br-name { font-size: 14px; font-weight: 600; color: #1A4F6E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.br-count { font-size: 11px; color: #9BBDD0; margin-top: 2px; }
.br-stars { display: flex; align-items: center; gap: 1px; flex-shrink: 0; }
.br-del { color: #C8DDE8; background: none; border: none; cursor: pointer; padding: 5px; flex-shrink: 0; transition: color 0.15s; }
.br-del:active { color: #F87171; }
.br-chevron { color: #C8DDE8; flex-shrink: 0; }
.br-empty { text-align: center; padding: 64px 0; }
.br-empty-icon { font-size: 48px; margin-bottom: 14px; }
.br-empty-text { font-size: 14px; color: #9BBDD0; margin-bottom: 22px; font-weight: 500; }
.skel { background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 18px; height: 68px; margin-bottom: 7px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* Bottom Sheet */
.bs-overlay { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; justify-content: flex-end; }
.bs-bg { position: absolute; inset: 0; background: rgba(15,20,30,0.45); }
.bs-panel { position: relative; background: #FAF8F5; border-radius: 28px 28px 0 0; padding: 8px 20px 32px; }
.bs-handle { width: 36px; height: 4px; background: rgba(176,216,238,0.6); border-radius: 100px; margin: 10px auto 18px; }
.bs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.bs-header-title { font-family: 'Caveat', cursive; font-size: 20px; font-weight: 700; color: #1A4F6E; }
.bs-close { background: rgba(176,216,238,0.25); border: none; border-radius: 10px; padding: 6px; cursor: pointer; color: #7BAEC8; display: flex; }
.bs-close:active { background: rgba(176,216,238,0.5); }
.bs-btn { display: flex; align-items: center; gap: 14px; background: rgba(255,255,255,0.8); border-radius: 18px; padding: 14px 16px; border: 1px solid rgba(176,216,238,0.35); cursor: pointer; width: 100%; margin-bottom: 8px; text-align: left; transition: background 0.15s; }
.bs-btn:active { background: rgba(255,255,255,1); }
.bs-btn-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bs-btn-title { font-size: 14px; font-weight: 600; color: #1A4F6E; }
.bs-btn-sub { font-size: 11px; color: #9BBDD0; margin-top: 1px; }
.bs-pick { display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.8); border-radius: 16px; padding: 12px 14px; border: 1px solid rgba(176,216,238,0.35); cursor: pointer; width: 100%; margin-bottom: 6px; text-align: left; }
.bs-pick:active { background: rgba(255,255,255,1); }
.bs-pick-name { font-size: 14px; font-weight: 600; color: #1A4F6E; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bs-pick-scroll { max-height: 280px; overflow-y: auto; }
`

export default function Brands() {
  const navigate = useNavigate()
  const [brands, setBrands] = useState([])
  const [productCounts, setProductCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [sheet, setSheet] = useState(null)

  async function load() {
    try {
      const snap = await getDocs(query(collection(db, 'brands'), orderBy('name')))
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setBrands(list)
      const counts = {}
      await Promise.all(list.map(async b => {
        const c = await getCountFromServer(collection(db, 'brands', b.id, 'products'))
        counts[b.id] = c.data().count
      }))
      setProductCounts(counts)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!confirm('確定要刪除這個品牌嗎？')) return
    await deleteDoc(doc(db, 'brands', id))
    setBrands(prev => prev.filter(b => b.id !== id))
  }

  return (
    <div className="br-page">
      <style>{S}</style>

      <div className="br-top">
        <div className="br-title">品牌管理</div>
        <button className="br-add" onClick={() => setSheet('choice')}>
          <Plus size={14} /> 新增
        </button>
      </div>

      {loading ? (
        <div>{[1, 2, 3].map(i => <div key={i} className="skel" />)}</div>
      ) : brands.length === 0 ? (
        <div className="br-empty">
          <div className="br-empty-icon">🏷️</div>
          <div className="br-empty-text">還沒有品牌紀錄<br />記錄嬛嬛喜歡的品牌</div>
          <button className="br-add" style={{ margin: '0 auto' }} onClick={() => navigate('/brands/new')}>
            <Plus size={14} /> 新增品牌
          </button>
        </div>
      ) : (
        <div className="fade-in">
          {brands.map(brand => (
            <div key={brand.id} className="br-card" onClick={() => navigate(`/brands/${brand.id}`)}>
              <BrandAvatar brand={brand} size="sm" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="br-name">{brand.name}</div>
                {productCounts[brand.id] > 0 && (
                  <div className="br-count">{productCounts[brand.id]} 個產品</div>
                )}
              </div>
              <div className="br-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12}
                    style={{ fill: i < (brand.rating || 0) ? '#4AAFDC' : 'none', color: i < (brand.rating || 0) ? '#4AAFDC' : '#B0D8EE' }}
                  />
                ))}
              </div>
              <button className="br-del" onClick={e => handleDelete(e, brand.id)}>
                <Trash2 size={15} />
              </button>
              <ChevronRight size={15} className="br-chevron" />
            </div>
          ))}
        </div>
      )}

      {sheet && (
        <div className="bs-overlay" onClick={() => setSheet(null)}>
          <div className="bs-bg" />
          <div className="bs-panel" onClick={e => e.stopPropagation()}>
            <div className="bs-handle" />
            <div className="bs-header">
              <div className="bs-header-title">
                {sheet === 'pick-brand' ? '選擇品牌' : '新增'}
              </div>
              <button className="bs-close" onClick={() => setSheet(null)}>
                <X size={18} />
              </button>
            </div>

            {sheet === 'choice' && (
              <>
                <button className="bs-btn" onClick={() => { setSheet(null); navigate('/brands/new') }}>
                  <div className="bs-btn-icon" style={{ background: 'rgba(26,79,110,0.12)' }}>
                    <Tag size={18} color="#1A4F6E" />
                  </div>
                  <div>
                    <div className="bs-btn-title">新增品牌</div>
                    <div className="bs-btn-sub">記錄一個新品牌</div>
                  </div>
                </button>
                <button className="bs-btn" onClick={() => brands.length > 0 ? setSheet('pick-brand') : navigate('/brands/new')}>
                  <div className="bs-btn-icon" style={{ background: 'rgba(52,211,153,0.15)' }}>
                    <Package size={18} color="#34D399" />
                  </div>
                  <div>
                    <div className="bs-btn-title">新增產品</div>
                    <div className="bs-btn-sub">選擇品牌後新增產品</div>
                  </div>
                </button>
              </>
            )}

            {sheet === 'pick-brand' && (
              <div className="bs-pick-scroll">
                {brands.map(brand => (
                  <button key={brand.id} className="bs-pick" onClick={() => { setSheet(null); navigate(`/brands/${brand.id}/products/new`) }}>
                    <BrandAvatar brand={brand} size="sm" />
                    <span className="bs-pick-name">{brand.name}</span>
                    <ChevronRight size={15} color="#B0D8EE" />
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
