import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, orderBy, query, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Plus, Trash2, Star, Camera, Pencil, ChartLine } from 'lucide-react'
import { BrandAvatar, STAR_FILL, STAR_EMPTY } from './Brands'

const PROD_CATEGORIES = { food: '食品', snack: '零食', litter: '貓砂', supplies: '用品', health: '保健品' }
const PROD_CAT_COLORS = {
  food: 'oklch(0.78 0.06 25)',
  snack: 'oklch(0.82 0.07 55)',
  litter: 'oklch(0.78 0.05 145)',
  supplies: 'oklch(0.75 0.06 290)',
  health: 'oklch(0.82 0.07 95)',
}

const S = `
.bd-hero { background: #FFFFFF; border-radius: 22px; padding: 18px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(58,46,46,0.05); display: flex; align-items: center; gap: 14px; }
.bd-hero-icon-wrap { position: relative; cursor: pointer; flex-shrink: 0; }
.bd-hero-camera { position: absolute; bottom: -4px; right: -4px; width: 22px; height: 22px; background: #3A2E2E; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; }
.bd-hero-name { font-family: 'Quicksand'; font-size: 20px; font-weight: 500; color: #3A2E2E; line-height: 1.15; }
.bd-hero-note { font-family: 'Nunito'; font-size: 12px; color: #6E5A5A; margin-top: 4px; line-height: 1.4; }
.bd-hero-stars { display: flex; align-items: center; gap: 2px; margin-top: 8px; }
.bd-section-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 0 6px; }
.bd-section-tag { font-family: 'JetBrains Mono'; font-size: 10px; letter-spacing: 0.15em; color: #B5A3A3; }
.bd-section-title { font-family: 'Quicksand'; font-size: 18px; font-weight: 500; color: #3A2E2E; margin-top: 2px; }
.bd-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: #FFFFFF; border-radius: 20px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(58,46,46,0.05); }
.bd-prod-img { width: 52px; height: 52px; border-radius: 14px; object-fit: cover; flex-shrink: 0; }
.bd-prod-placeholder { width: 52px; height: 52px; border-radius: 14px; background: #FBF6F1; border: 1px solid #EFE3D6; flex-shrink: 0; }
.bd-prod-name { font-family: 'Quicksand'; font-size: 15px; font-weight: 500; color: #3A2E2E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bd-prod-cat { font-family: 'JetBrains Mono'; font-size: 9.5px; font-weight: 500; padding: 2px 7px; border-radius: 100px; margin-left: 6px; flex-shrink: 0; letter-spacing: 0.06em; }
.bd-prod-note { font-family: 'Nunito'; font-size: 11px; color: #B5A3A3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }
.bd-prod-price { font-family: 'JetBrains Mono'; font-size: 13px; color: #3A2E2E; margin-top: 4px; }
.bd-prod-stars { display: flex; align-items: center; gap: 2px; margin-top: 4px; }
.bd-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; color: #D8C8C8; transition: color 0.15s; flex-shrink: 0; }
.bd-icon-btn:active { color: #3A2E2E; }
.bd-icon-btn.danger:active { color: oklch(0.65 0.18 25); }
.bd-empty { text-align: center; padding: 48px 16px; }
.bd-empty-icon { font-size: 40px; margin-bottom: 12px; }
.bd-empty-title { font-family: 'Quicksand'; font-size: 17px; color: #6E5A5A; margin-bottom: 6px; }
.bd-empty-desc { font-family: 'Nunito'; font-size: 12px; color: #B5A3A3; margin-bottom: 18px; line-height: 1.5; }
.skel-hero { border-radius: 22px; height: 96px; margin-bottom: 20px; background: linear-gradient(90deg, rgba(58,46,46,0.04) 25%, rgba(58,46,46,0.08) 50%, rgba(58,46,46,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; }
.skel { background: linear-gradient(90deg, rgba(58,46,46,0.04) 25%, rgba(58,46,46,0.08) 50%, rgba(58,46,46,0.04) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 20px; height: 80px; margin-bottom: 8px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
@keyframes spin { to { transform: rotate(360deg); } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

const addBtnStyle = {
  background: '#3A2E2E', color: '#FBF6F1', border: 'none',
  padding: '8px 14px', borderRadius: 999,
  fontFamily: 'Nunito', fontWeight: 600, fontSize: 12,
  display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
}

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
    } catch (e) { console.error(e) }
    finally { setUploadingIcon(false) }
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
    <div className="flex flex-col min-h-full">
      <PageHeader title="品牌" />
      <div style={{ padding: '16px 16px 48px' }}>
        <style>{S}</style>
        <div className="skel-hero" />
        {[1, 2, 3].map(i => <div key={i} className="skel" />)}
      </div>
    </div>
  )

  if (!brand) return (
    <div style={{ padding: 24, color: '#B5A3A3', textAlign: 'center', paddingTop: 80, fontFamily: 'Nunito' }}>
      找不到品牌
    </div>
  )

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title={brand.name} />
      <div style={{ padding: '16px 16px 48px' }}>
        <style>{S}</style>

        {/* Brand Hero */}
        <div className="bd-hero fade-in">
          <div className="bd-hero-icon-wrap" onClick={() => iconRef.current.click()}>
            <BrandAvatar brand={brand} size="lg" />
            <div className="bd-hero-camera">
              {uploadingIcon
                ? <div style={{ width: 10, height: 10, border: '2px solid #FBF6F1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <Camera size={11} color="#FBF6F1" />
              }
            </div>
            <input ref={iconRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleIconUpload} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="bd-hero-name">{brand.name}</div>
            {brand.note && <div className="bd-hero-note">{brand.note}</div>}
            <div className="bd-hero-stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13}
                  style={{ fill: i < (brand.rating || 0) ? STAR_FILL : 'none', color: i < (brand.rating || 0) ? STAR_FILL : STAR_EMPTY }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bd-section-top">
          <div>
            <div className="bd-section-tag">SECTION · 品</div>
            <div className="bd-section-title">產品列表</div>
          </div>
          <button style={addBtnStyle} onClick={() => navigate(`/brands/${id}/products/new`)}>
            <Plus size={13} /> 新增產品
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bd-empty fade-in">
            <div className="bd-empty-icon">📦</div>
            <div className="bd-empty-title">還沒有產品</div>
            <div className="bd-empty-desc">新增這個品牌下的具體產品</div>
            <button style={{ ...addBtnStyle, margin: '0 auto' }} onClick={() => navigate(`/brands/${id}/products/new`)}>
              <Plus size={13} /> 新增產品
            </button>
          </div>
        ) : (
          <div className="fade-in">
            {products.map(p => (
              <div key={p.id} className="bd-card">
                {p.url
                  ? <img src={p.url} alt={p.name} className="bd-prod-img" />
                  : <div className="bd-prod-placeholder" />
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="bd-prod-name">{p.name}</span>
                    {p.category && (
                      <span className="bd-prod-cat" style={{
                        background: (PROD_CAT_COLORS[p.category] || '#B5A3A3') + '22',
                        color: PROD_CAT_COLORS[p.category] || '#B5A3A3',
                      }}>
                        {PROD_CATEGORIES[p.category] || p.category}
                      </span>
                    )}
                  </div>
                  {p.note && <div className="bd-prod-note">{p.note}</div>}
                  <div className="bd-prod-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11}
                        style={{ fill: i < (p.rating || 0) ? STAR_FILL : 'none', color: i < (p.rating || 0) ? STAR_FILL : STAR_EMPTY }}
                      />
                    ))}
                  </div>
                  {p.price != null && <div className="bd-prod-price">${p.price.toLocaleString()}</div>}
                </div>
                <button className="bd-icon-btn" onClick={() => navigate(`/brands/${id}/products/${p.id}/prices`)}>
                  <ChartLine size={15} />
                </button>
                <button className="bd-icon-btn" onClick={() => navigate(`/brands/${id}/products/${p.id}/edit`)}>
                  <Pencil size={15} />
                </button>
                <button className="bd-icon-btn danger" onClick={() => handleDeleteProduct(p.id)}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
