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

const STAR_FILL = 'oklch(0.78 0.06 25)'
const STAR_EMPTY = '#D8C8C8'

function BrandAvatar({ brand, size = 'sm' }) {
  const icon = brand.iconUrl || LOCAL_ICONS[brand.name]
  const sm = size === 'sm'
  const style = {
    width: sm ? 44 : 60,
    height: sm ? 44 : 60,
    borderRadius: 14,
    flexShrink: 0,
    objectFit: 'contain',
    background: '#FBF6F1',
    border: '1px solid #EFE3D6',
  }
  if (icon) return <img src={icon} alt={brand.name} style={style} />
  return (
    <div style={{
      ...style,
      background: '#3A2E2E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FBF6F1',
      fontFamily: 'Quicksand',
      fontWeight: 500,
      fontSize: sm ? 16 : 22,
    }}>
      {brand.name?.[0] || '?'}
    </div>
  )
}

export { BrandAvatar, LOCAL_ICONS, STAR_FILL, STAR_EMPTY }

const S = `
.br-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #FFFFFF; border-radius: 20px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(58,46,46,0.05); cursor: pointer; transition: transform 0.15s; }
.br-card:active { transform: scale(0.99); }
.br-name { font-family: 'Quicksand'; font-size: 15px; font-weight: 500; color: #3A2E2E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.br-count { font-family: 'JetBrains Mono'; font-size: 10px; color: #B5A3A3; margin-top: 3px; letter-spacing: 0.08em; }
.br-stars { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.br-icon-btn { color: #D8C8C8; background: none; border: none; cursor: pointer; padding: 5px; flex-shrink: 0; transition: color 0.15s; }
.br-icon-btn:active { color: oklch(0.78 0.06 25); }
.br-empty { text-align: center; padding: 64px 16px; }
.br-empty-icon { font-size: 44px; margin-bottom: 14px; }
.br-empty-title { font-family: 'Quicksand'; font-size: 18px; color: #6E5A5A; margin-bottom: 8px; }
.br-empty-desc { font-family: 'Nunito'; font-size: 12px; color: #B5A3A3; margin-bottom: 22px; line-height: 1.5; }
.skel { background: linear-gradient(90deg, rgba(58,46,46,0.04) 25%, rgba(58,46,46,0.08) 50%, rgba(58,46,46,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 20px; height: 76px; margin-bottom: 8px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* Bottom Sheet */
.bs-overlay { position: fixed; inset: 0; z-index: 50; display: flex; flex-direction: column; justify-content: flex-end; }
.bs-bg { position: absolute; inset: 0; background: rgba(58,46,46,0.45); }
.bs-panel { position: relative; background: #FBF6F1; border-radius: 28px 28px 0 0; padding: 8px 20px 32px; }
.bs-handle { width: 36px; height: 4px; background: #D8C8C8; border-radius: 100px; margin: 10px auto 18px; }
.bs-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.bs-header-title { font-family: 'Quicksand'; font-size: 20px; font-weight: 500; color: #3A2E2E; }
.bs-close { background: rgba(58,46,46,0.06); border: none; border-radius: 12px; padding: 6px; cursor: pointer; color: #6E5A5A; display: flex; }
.bs-close:active { background: rgba(58,46,46,0.12); }
.bs-btn { display: flex; align-items: center; gap: 14px; background: #FFFFFF; border-radius: 18px; padding: 14px 16px; border: none; box-shadow: 0 2px 8px rgba(58,46,46,0.04); cursor: pointer; width: 100%; margin-bottom: 8px; text-align: left; transition: transform 0.15s; }
.bs-btn:active { transform: scale(0.99); }
.bs-btn-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bs-btn-title { font-family: 'Quicksand'; font-size: 15px; font-weight: 500; color: #3A2E2E; }
.bs-btn-sub { font-family: 'Nunito'; font-size: 11px; color: #B5A3A3; margin-top: 2px; }
.bs-pick { display: flex; align-items: center; gap: 12px; background: #FFFFFF; border-radius: 16px; padding: 12px 14px; border: none; box-shadow: 0 2px 8px rgba(58,46,46,0.04); cursor: pointer; width: 100%; margin-bottom: 6px; text-align: left; }
.bs-pick:active { transform: scale(0.99); }
.bs-pick-name { font-family: 'Quicksand'; font-size: 15px; font-weight: 500; color: #3A2E2E; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bs-pick-scroll { max-height: 280px; overflow-y: auto; }
`

const addBtnStyle = {
  background: '#3A2E2E', color: '#FBF6F1', border: 'none',
  padding: '8px 14px', borderRadius: 999,
  fontFamily: 'Nunito', fontWeight: 600, fontSize: 12,
  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
}

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
    <div style={{ padding: '8px 16px 16px' }}>
      <style>{S}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 6px 14px' }}>
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, letterSpacing: '0.15em', color: '#B5A3A3' }}>SECTION · 牌</div>
          <div style={{ fontFamily: 'Quicksand', fontSize: 26, color: '#3A2E2E', letterSpacing: '-0.01em', marginTop: 2 }}>
            <span>品牌</span> 管理
          </div>
        </div>
        <button style={addBtnStyle} onClick={() => setSheet('choice')}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {loading ? (
        <div>{[1, 2, 3].map(i => <div key={i} className="skel" />)}</div>
      ) : brands.length === 0 ? (
        <div className="br-empty">
          <div className="br-empty-icon">🏷️</div>
          <div className="br-empty-title">還沒有品牌紀錄</div>
          <div className="br-empty-desc">記錄嬛嬛喜歡的品牌</div>
          <button style={{ ...addBtnStyle, margin: '0 auto' }} onClick={() => navigate('/brands/new')}>
            <Plus size={13} /> 新增品牌
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
                    style={{ fill: i < (brand.rating || 0) ? STAR_FILL : 'none', color: i < (brand.rating || 0) ? STAR_FILL : STAR_EMPTY }}
                  />
                ))}
              </div>
              <button className="br-icon-btn" onClick={e => handleDelete(e, brand.id)}>
                <Trash2 size={15} />
              </button>
              <ChevronRight size={15} style={{ color: '#D8C8C8', flexShrink: 0 }} />
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
                  <div className="bs-btn-icon" style={{ background: 'oklch(0.78 0.06 25 / 0.18)' }}>
                    <Tag size={18} color="oklch(0.55 0.08 25)" />
                  </div>
                  <div>
                    <div className="bs-btn-title">新增品牌</div>
                    <div className="bs-btn-sub">記錄一個新品牌</div>
                  </div>
                </button>
                <button className="bs-btn" onClick={() => brands.length > 0 ? setSheet('pick-brand') : navigate('/brands/new')}>
                  <div className="bs-btn-icon" style={{ background: 'oklch(0.82 0.05 145 / 0.22)' }}>
                    <Package size={18} color="oklch(0.45 0.07 145)" />
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
                    <ChevronRight size={15} color="#D8C8C8" />
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
