import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, deleteDoc, doc, orderBy, query, getCountFromServer } from 'firebase/firestore'
import { db } from '../firebase'
import { Plus, Trash2, ChevronRight, Tag, Package, X } from 'lucide-react'

const LOCAL_ICONS = {
  'PS BUBU': '/huan_huan/brand-icons/ps_bubu.png',
  '毛掌醫學': '/huan_huan/brand-icons/maozhuang.png',
  '肉球世界': '/huan_huan/brand-icons/rouqiu.png',
  '貓有話說': '/huan_huan/brand-icons/maohuashuo.png',
}

// Rotation of fallback colors (for branded chip when no icon)
const BRAND_COLORS = ['#FFC8D6', '#C8EBD9', '#FFD4B0', '#E0CFF2', '#FFE4A0', '#C8E0F2']

function BrandAvatar({ brand, idx = 0, size = 44 }) {
  const icon = brand.iconUrl || LOCAL_ICONS[brand.name]
  if (icon) return (
    <img src={icon} alt={brand.name} style={{
      width: size, height: size, borderRadius: 14, objectFit: 'contain',
      background: '#fff', border: '2px solid #3D2A2A', flexShrink: 0,
    }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: 14,
      background: BRAND_COLORS[idx % BRAND_COLORS.length],
      border: '2px solid #3D2A2A', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#3D2A2A', fontFamily: "'Fredoka', system-ui", fontWeight: 700, fontSize: 16,
    }}>{brand.name?.[0] || '?'}</div>
  )
}

const STAR_FILL = '#F5C04D'
const STAR_EMPTY = '#FFFFFF'

export { BrandAvatar, LOCAL_ICONS, STAR_FILL, STAR_EMPTY }

const addBtnStyle = {
  background: '#3D2A2A', color: '#FFFFFF', border: '2px solid #3D2A2A',
  padding: '8px 14px', borderRadius: 999,
  fontFamily: "'Fredoka', system-ui", fontWeight: 700, fontSize: 12,
  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
  boxShadow: '0 3px 0 #F5C04D',
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

  const totalProducts = Object.values(productCounts).reduce((a, b) => a + b, 0)
  const fiveStarCount = brands.filter(b => (b.rating || 0) === 5).length

  return (
    <div style={{ padding: '4px 14px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px 14px' }}>
        <div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600 }}>brand library ♡</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 26, fontWeight: 600, color: '#3D2A2A', letterSpacing: '-0.01em', marginTop: 2 }}>
            品牌管理
          </div>
        </div>
        <button style={addBtnStyle} onClick={() => setSheet('choice')}>
          <Plus size={13} /> 新增
        </button>
      </div>

      {/* Hero card */}
      {!loading && brands.length > 0 && (
        <div style={{
          background: '#FFE4A0', borderRadius: 24, padding: 18,
          border: '2px solid #3D2A2A', boxShadow: '0 4px 0 #3D2A2A',
          marginBottom: 14, position: 'relative',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" style={{ position: 'absolute', right: 16, top: 14, transform: 'rotate(15deg)' }}>
            <path d="M12 2 L13.5 9 L20 10 L13.5 11 L12 18 L10.5 11 L4 10 L10.5 9 Z" fill="#FF92AE" />
          </svg>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 18, color: '#3D2A2A', fontWeight: 600 }}>嬛嬛的最愛 ♡</div>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 44, lineHeight: 1, fontWeight: 700, letterSpacing: '-0.02em', color: '#3D2A2A', marginTop: 4 }}>
            {brands.length}<span style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 14, marginLeft: 4, fontWeight: 500 }}>brands</span>
          </div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, marginTop: 6, color: '#3D2A2A', opacity: 0.7 }}>
            共 {totalProducts} 個產品 · {fiveStarCount} 個 5 星評價
          </div>
        </div>
      )}

      {loading ? (
        <div>{[1, 2, 3].map(i => <div key={i} style={{ height: 64, background: '#FFFFFF', border: '2px solid #F0E4E0', borderRadius: 18, marginBottom: 7, opacity: 0.5 }} />)}</div>
      ) : brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 16px' }}>
          <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 18, fontWeight: 600, color: '#3D2A2A', marginBottom: 6 }}>還沒有品牌</div>
          <div style={{ fontFamily: "'Caveat', cursive", fontSize: 16, color: '#FF92AE', fontWeight: 600, marginBottom: 12 }}>♡ 記錄嬛嬛喜歡的品牌</div>
          <button style={{ ...addBtnStyle, margin: '0 auto' }} onClick={() => navigate('/brands/new')}>
            <Plus size={13} /> 新增品牌
          </button>
        </div>
      ) : (
        <div>
          {brands.map((brand, i) => (
            <div key={brand.id} onClick={() => navigate(`/brands/${brand.id}`)} style={{
              background: '#FFFFFF', borderRadius: 18, padding: '10px 12px', marginBottom: 7,
              border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A',
              display: 'grid', gridTemplateColumns: '44px 1fr auto auto', gap: 12, alignItems: 'center',
              cursor: 'pointer',
            }}>
              <BrandAvatar brand={brand} idx={i} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 14.5, fontWeight: 600, color: '#3D2A2A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</div>
                {productCounts[brand.id] > 0 && (
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace", fontSize: 10, color: '#C4A8A8', marginTop: 2, letterSpacing: '0.08em' }}>
                    {productCounts[brand.id]} 個產品
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <svg key={k} width="11" height="11" viewBox="0 0 24 24">
                    <path d="M12 2 L14.5 9 L22 10 L16.5 14.5 L18 22 L12 18 L6 22 L7.5 14.5 L2 10 L9.5 9 Z"
                      fill={k < (brand.rating || 0) ? '#F5C04D' : '#fff'}
                      stroke="#3D2A2A" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                ))}
              </div>
              <button onClick={e => handleDelete(e, brand.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#C4A8A8' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Sheet */}
      {sheet && (
        <div onClick={() => setSheet(null)} style={{
          position: 'fixed', inset: 0, zIndex: 50,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          background: 'rgba(61,42,42,0.45)',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#FFF9F2', borderRadius: '28px 28px 0 0',
            padding: '8px 20px 32px',
            border: '2px solid #3D2A2A', borderBottom: 'none',
          }}>
            <div style={{ width: 36, height: 4, background: '#3D2A2A', borderRadius: 100, margin: '10px auto 18px', opacity: 0.3 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 20, fontWeight: 600, color: '#3D2A2A' }}>
                {sheet === 'pick-brand' ? '選擇品牌' : '新增'}
              </div>
              <button onClick={() => setSheet(null)} style={{ background: '#FFE4A0', border: '2px solid #3D2A2A', borderRadius: 12, padding: 4, cursor: 'pointer', display: 'flex' }}>
                <X size={16} color="#3D2A2A" />
              </button>
            </div>

            {sheet === 'choice' && (
              <>
                <button onClick={() => { setSheet(null); navigate('/brands/new') }} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                  background: '#FFFFFF', borderRadius: 18, padding: '12px 14px', marginBottom: 8,
                  border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFC8D6', border: '2px solid #3D2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Tag size={18} color="#3D2A2A" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 15, fontWeight: 600, color: '#3D2A2A' }}>新增品牌</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#C4A8A8', marginTop: 2 }}>記錄一個新品牌</div>
                  </div>
                </button>
                <button onClick={() => brands.length > 0 ? setSheet('pick-brand') : navigate('/brands/new')} style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                  background: '#FFFFFF', borderRadius: 18, padding: '12px 14px',
                  border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A', cursor: 'pointer', textAlign: 'left',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#C8EBD9', border: '2px solid #3D2A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={18} color="#3D2A2A" />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Fredoka', system-ui", fontSize: 15, fontWeight: 600, color: '#3D2A2A' }}>新增產品</div>
                    <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: 11, color: '#C4A8A8', marginTop: 2 }}>選擇品牌後新增產品</div>
                  </div>
                </button>
              </>
            )}

            {sheet === 'pick-brand' && (
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {brands.map((brand, i) => (
                  <button key={brand.id} onClick={() => { setSheet(null); navigate(`/brands/${brand.id}/products/new`) }} style={{
                    display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                    background: '#FFFFFF', borderRadius: 16, padding: '10px 12px', marginBottom: 6,
                    border: '2px solid #3D2A2A', boxShadow: '0 2px 0 #3D2A2A', cursor: 'pointer', textAlign: 'left',
                  }}>
                    <BrandAvatar brand={brand} idx={i} size={36} />
                    <span style={{ fontFamily: "'Fredoka', system-ui", fontSize: 14, fontWeight: 600, color: '#3D2A2A', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{brand.name}</span>
                    <ChevronRight size={15} color="#C4A8A8" />
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
