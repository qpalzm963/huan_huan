import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, orderBy, query, deleteDoc, updateDoc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import PageHeader from '../components/PageHeader'
import { Plus, Trash2, Star, Camera, Pencil, ChartLine } from 'lucide-react'
import { BrandAvatar } from './Brands'

const PROD_CATEGORIES = { food: '食品', snack: '零食', litter: '貓砂', supplies: '用品', health: '保健品' }
const PROD_CAT_COLORS = { food: '#4AAFDC', snack: '#F97316', litter: '#34D399', supplies: '#A78BFA', health: '#F59E0B' }

const S = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap');
.bd-page { background: #F5F0EB; min-height: 100%; padding: 16px 16px 48px; }
.bd-hero { background: rgba(255,255,255,0.76); border-radius: 22px; border: 1px solid rgba(176,216,238,0.4); padding: 18px 18px; margin-bottom: 20px; backdrop-filter: blur(6px); display: flex; align-items: center; gap: 14px; }
.bd-hero-icon-wrap { position: relative; cursor: pointer; flex-shrink: 0; }
.bd-hero-camera { position: absolute; bottom: -4px; right: -4px; width: 22px; height: 22px; background: #4AAFDC; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #F5F0EB; }
.bd-hero-name { font-family: 'Caveat', cursive; font-size: 24px; font-weight: 700; color: #1A4F6E; line-height: 1.1; }
.bd-hero-note { font-size: 12px; color: #7BAEC8; margin-top: 3px; line-height: 1.4; }
.bd-hero-stars { display: flex; align-items: center; gap: 2px; margin-top: 6px; }
.bd-section-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.bd-section-title { font-family: 'Caveat', cursive; font-size: 22px; font-weight: 700; color: #1A4F6E; }
.bd-add { display: flex; align-items: center; gap: 5px; background: #1A4F6E; color: #fff; font-size: 12px; font-weight: 700; padding: 8px 14px; border-radius: 100px; border: none; cursor: pointer; }
.bd-add:active { opacity: 0.8; transform: scale(0.97); }
.bd-card { display: flex; align-items: center; gap: 12px; padding: 12px 14px; background: rgba(255,255,255,0.76); border-radius: 18px; margin-bottom: 7px; border: 1px solid rgba(176,216,238,0.4); backdrop-filter: blur(5px); }
.bd-prod-img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
.bd-prod-placeholder { width: 48px; height: 48px; border-radius: 12px; background: rgba(176,216,238,0.2); border: 1px solid rgba(176,216,238,0.35); flex-shrink: 0; }
.bd-prod-name { font-size: 14px; font-weight: 600; color: #1A4F6E; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bd-prod-cat { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; margin-left: 6px; flex-shrink: 0; }
.bd-prod-note { font-size: 11px; color: #9BBDD0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px; }
.bd-prod-price { font-family: 'Caveat', cursive; font-size: 16px; font-weight: 700; color: #4AAFDC; margin-top: 2px; }
.bd-prod-stars { display: flex; align-items: center; gap: 1px; margin-top: 3px; }
.bd-icon-btn { background: none; border: none; cursor: pointer; padding: 5px; color: #C8DDE8; transition: color 0.15s; flex-shrink: 0; }
.bd-icon-btn:active { color: #4AAFDC; }
.bd-icon-btn.danger:active { color: #F87171; }
.bd-empty { text-align: center; padding: 48px 0; }
.bd-empty-icon { font-size: 40px; margin-bottom: 12px; }
.bd-empty-text { font-size: 14px; color: #9BBDD0; margin-bottom: 18px; font-weight: 500; }
.skel-hero { background: rgba(255,255,255,0.6); border-radius: 22px; border: 1px solid rgba(176,216,238,0.35); height: 96px; margin-bottom: 20px; animation: shimmer 1.35s infinite; background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; }
.skel { background: linear-gradient(90deg, rgba(176,216,238,0.22) 25%, rgba(176,216,238,0.48) 50%, rgba(176,216,238,0.22) 75%); background-size: 200% 100%; animation: shimmer 1.35s infinite; border-radius: 18px; height: 72px; margin-bottom: 7px; }
@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }
.fade-in { animation: fadeUp 0.32s ease both; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`

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
    <div className="bd-page">
      <style>{S}</style>
      <div className="skel-hero" />
      {[1, 2, 3].map(i => <div key={i} className="skel" />)}
    </div>
  )

  if (!brand) return (
    <div style={{ padding: 24, color: '#9BBDD0', textAlign: 'center', paddingTop: 80 }}>
      找不到品牌
    </div>
  )

  return (
    <div className="flex flex-col min-h-full" style={{ background: '#F5F0EB' }}>
      <PageHeader title={brand.name} />
      <div className="bd-page" style={{ padding: '16px 16px 48px' }}>
        <style>{S}</style>

        {/* Brand Hero */}
        <div className="bd-hero fade-in">
          <div className="bd-hero-icon-wrap" onClick={() => iconRef.current.click()}>
            <BrandAvatar brand={brand} size="lg" />
            <div className="bd-hero-camera">
              {uploadingIcon
                ? <div style={{ width: 10, height: 10, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                : <Camera size={11} color="#fff" />
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
                  style={{ fill: i < (brand.rating || 0) ? '#4AAFDC' : 'none', color: i < (brand.rating || 0) ? '#4AAFDC' : '#B0D8EE' }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bd-section-top">
          <div className="bd-section-title">產品列表</div>
          <button className="bd-add" onClick={() => navigate(`/brands/${id}/products/new`)}>
            <Plus size={13} /> 新增產品
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bd-empty fade-in">
            <div className="bd-empty-icon">📦</div>
            <div className="bd-empty-text">還沒有產品<br />新增這個品牌下的具體產品</div>
            <button className="bd-add" style={{ margin: '0 auto' }} onClick={() => navigate(`/brands/${id}/products/new`)}>
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
                        background: (PROD_CAT_COLORS[p.category] || '#9BBDD0') + '22',
                        color: PROD_CAT_COLORS[p.category] || '#9BBDD0',
                      }}>
                        {PROD_CATEGORIES[p.category] || p.category}
                      </span>
                    )}
                  </div>
                  {p.note && <div className="bd-prod-note">{p.note}</div>}
                  <div className="bd-prod-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={11}
                        style={{ fill: i < (p.rating || 0) ? '#4AAFDC' : 'none', color: i < (p.rating || 0) ? '#4AAFDC' : '#B0D8EE' }}
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
