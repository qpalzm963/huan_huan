import { useEffect, useMemo, useRef, useState } from 'react'

const STAGE_SIZE = Math.min(window.innerWidth - 48, 360)
const MAX_SCALE_FACTOR = 4

function clampOffset(offset, scale, imgSize) {
  const dispW = imgSize.w * scale
  const dispH = imgSize.h * scale
  const maxX = Math.max(0, (dispW - STAGE_SIZE) / 2)
  const maxY = Math.max(0, (dispH - STAGE_SIZE) / 2)
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  }
}

export default function AvatarCropModal({ imageFile, onConfirm, onCancel, onReset }) {
  const imgRef = useRef(null)
  const imgUrl = useMemo(() => URL.createObjectURL(imageFile), [imageFile])
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [minScale, setMinScale] = useState(1)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const pinchRef = useRef(null)

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
    setMinScale(ms)
    setScale(ms)
    setOffset({ x: 0, y: 0 })
  }

  function onPointerDown(e) {
    if (e.pointerType === 'touch' && e.isPrimary === false) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
  }

  function onPointerMove(e) {
    if (!dragRef.current) return
    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY
    const next = {
      x: dragRef.current.startOffset.x + dx,
      y: dragRef.current.startOffset.y + dy,
    }
    setOffset(clampOffset(next, scale, imgSize))
  }

  function onPointerUp(e) {
    e.currentTarget.releasePointerCapture(e.pointerId)
    dragRef.current = null
  }

  function onWheel(e) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1
    const nextScale = Math.max(minScale, Math.min(minScale * MAX_SCALE_FACTOR, scale * factor))
    setScale(nextScale)
    setOffset(o => clampOffset(o, nextScale, imgSize))
  }

  function onTouchStart(e) {
    if (e.touches.length === 2) {
      const [a, b] = e.touches
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      pinchRef.current = { startDist: dist, startScale: scale }
      dragRef.current = null
    }
  }

  function onTouchMove(e) {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const [a, b] = e.touches
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const factor = dist / pinchRef.current.startDist
      const nextScale = Math.max(minScale, Math.min(minScale * MAX_SCALE_FACTOR, pinchRef.current.startScale * factor))
      setScale(nextScale)
      setOffset(o => clampOffset(o, nextScale, imgSize))
    }
  }

  function onTouchEnd(e) {
    if (e.touches.length < 2) pinchRef.current = null
  }

  function produceBase64() {
    const img = imgRef.current
    if (!img) return null
    const sWidth = STAGE_SIZE / scale
    const sHeight = STAGE_SIZE / scale
    const sx = (imgSize.w - sWidth) / 2 - offset.x / scale
    const sy = (imgSize.h - sHeight) / 2 - offset.y / scale

    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 128, 128)
    return canvas.toDataURL('image/webp', 0.85)
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'relative',
          width: STAGE_SIZE, height: STAGE_SIZE,
          overflow: 'hidden',
          touchAction: 'none',
          userSelect: 'none',
          cursor: 'grab',
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
          onClick={() => onConfirm(produceBase64())}
          style={{ padding: '10px 24px', borderRadius: 100, border: 'none', background: '#4AAFDC', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          完成
        </button>
      </div>
    </div>
  )
}
