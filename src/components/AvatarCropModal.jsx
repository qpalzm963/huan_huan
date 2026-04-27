import { useEffect, useMemo, useRef, useState } from 'react'

const STAGE_SIZE = Math.min(window.innerWidth - 48, 360)

export default function AvatarCropModal({ imageFile, onConfirm, onCancel, onReset }) {
  const imgRef = useRef(null)
  const imgUrl = useMemo(() => URL.createObjectURL(imageFile), [imageFile])
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    return () => URL.revokeObjectURL(imgUrl)
  }, [imgUrl])

  function handleImgLoad() {
    const img = imgRef.current
    if (!img) return
    const w = img.naturalWidth
    const h = img.naturalHeight
    setImgSize({ w, h })
    const ms = Math.max(STAGE_SIZE / w, STAGE_SIZE / h)
    setScale(ms)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: STAGE_SIZE, height: STAGE_SIZE,
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <img
          ref={imgRef}
          src={imgUrl}
          alt=""
          onLoad={handleImgLoad}
          draggable={false}
          style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: imgSize.w, height: imgSize.h,
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0,
            borderRadius: '50%',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onReset}
          style={{ padding: '10px 18px', borderRadius: 100, border: '1px solid #fff', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}
        >
          還原預設
        </button>
        <button
          onClick={onCancel}
          style={{ padding: '10px 18px', borderRadius: 100, border: '1px solid #fff', background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer' }}
        >
          取消
        </button>
        <button
          onClick={() => onConfirm(null)}
          style={{ padding: '10px 24px', borderRadius: 100, border: 'none', background: '#4AAFDC', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          完成
        </button>
      </div>
    </div>
  )
}
