# 首頁頭像上傳與裁切 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓 Dashboard 頭像可上傳照片並用 Instagram 式圓形拖曳/縮放裁切，128x128 webp base64 存進 Firestore `settings/profile`，跨裝置同步並可還原預設 🐱 emoji。

**Architecture:** 新增獨立、不依賴 Firestore 的 `AvatarCropModal` 元件處理「給 File、回 base64」；新增 `profileSettings.js` 包裝 Firestore `settings/profile` 文件的讀寫；`Dashboard.jsx` 的圓形頭像加上 `<input type="file">` 入口、mount 時讀 profile、modal `onConfirm` 時寫 Firestore 並更新 state。

**Tech Stack:** React 19, Firebase Firestore (`doc`, `getDoc`, `setDoc`, `serverTimestamp`), HTML5 Canvas (toDataURL webp)

**Spec：** `docs/superpowers/specs/2026-04-27-avatar-upload-design.md`

> **註：** 本專案無自動測試框架，所有驗證以手動操作（dev server + 瀏覽器）為主。

---

### Task 1：新增 `profileSettings.js`

**Files:**
- Create: `src/utils/profileSettings.js`

- [ ] **Step 1：建立檔案**

```js
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const PROFILE_REF = doc(db, 'settings', 'profile')

export async function getProfile() {
  try {
    const snap = await getDoc(PROFILE_REF)
    if (!snap.exists()) return { avatarBase64: null }
    const data = snap.data()
    return { avatarBase64: data.avatarBase64 || null }
  } catch (e) {
    console.error('getProfile failed', e)
    return { avatarBase64: null }
  }
}

export async function saveAvatar(base64OrNull) {
  await setDoc(
    PROFILE_REF,
    { avatarBase64: base64OrNull, updatedAt: serverTimestamp() },
    { merge: true }
  )
}
```

- [ ] **Step 2：手動驗證 import 正確**

執行：
```bash
npx eslint src/utils/profileSettings.js
```
預期：無 error/warning。

- [ ] **Step 3：commit**

```bash
git add src/utils/profileSettings.js
git commit -m "feat: add profileSettings util for avatar persistence"
```

---

### Task 2：建立 `AvatarCropModal` 骨架（顯示照片 + 圓形遮罩，先不互動）

**Files:**
- Create: `src/components/AvatarCropModal.jsx`

- [ ] **Step 1：建立元件**

```jsx
import { useEffect, useRef, useState } from 'react'

const STAGE_SIZE = Math.min(window.innerWidth - 48, 360)

export default function AvatarCropModal({ imageFile, onConfirm, onCancel, onReset }) {
  const imgRef = useRef(null)
  const [imgUrl, setImgUrl] = useState(null)
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 })
  const [minScale, setMinScale] = useState(1)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const url = URL.createObjectURL(imageFile)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [imageFile])

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
        {imgUrl && (
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
        )}
        {/* 圓形遮罩：圓內透明、圓外黑色 */}
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
```

> 註：本步驟「完成」按鈕暫時 `onConfirm(null)`，Task 4 會改成輸出 base64。

- [ ] **Step 2：lint**

```bash
npx eslint src/components/AvatarCropModal.jsx
```
預期：無 error。

- [ ] **Step 3：commit**

```bash
git add src/components/AvatarCropModal.jsx
git commit -m "feat: scaffold AvatarCropModal with image + circular mask"
```

---

### Task 3：實作拖曳與縮放互動 + 邊界 clamp

**Files:**
- Modify: `src/components/AvatarCropModal.jsx`

- [ ] **Step 1：新增 clamp 工具與互動 handler**

在 `import` 之後（`STAGE_SIZE` 常數附近）新增：

```js
const MAX_SCALE_FACTOR = 4

function clampOffset(offset, scale, imgSize) {
  // 照片在 stage 內顯示的實際尺寸
  const dispW = imgSize.w * scale
  const dispH = imgSize.h * scale
  // 照片中心相對 stage 中心可移動的最大距離（避免露白）
  const maxX = Math.max(0, (dispW - STAGE_SIZE) / 2)
  const maxY = Math.max(0, (dispH - STAGE_SIZE) / 2)
  return {
    x: Math.max(-maxX, Math.min(maxX, offset.x)),
    y: Math.max(-maxY, Math.min(maxY, offset.y)),
  }
}
```

- [ ] **Step 2：在 component 內新增 drag 與 wheel handler**

在 `handleImgLoad` 之後、`return` 之前加入：

```jsx
const dragRef = useRef(null) // { startX, startY, startOffset }
const pinchRef = useRef(null) // { startDist, startScale }

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

// 雙指縮放：用 touch events 計算雙指距離
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
```

- [ ] **Step 3：把 handler 綁到 stage div**

把 `<div style={{ position: 'relative', width: STAGE_SIZE, ... }}>` 那層改為：

```jsx
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
```

- [ ] **Step 4：手動驗證互動**

```bash
npm run dev
```

打開 `http://localhost:5173`，暫時在 Dashboard 點頭像目前還沒接 modal，先用 React DevTools 或在 `App.jsx` 暫時掛 modal 測試（這步可選；如果太麻煩，留到 Task 5 接好後一起測）。

如果先跳過驗證，至少 lint：

```bash
npx eslint src/components/AvatarCropModal.jsx
```
預期：無 error。

- [ ] **Step 5：commit**

```bash
git add src/components/AvatarCropModal.jsx
git commit -m "feat: add pan/zoom interactions to AvatarCropModal"
```

---

### Task 4：實作 canvas 裁切輸出 base64

**Files:**
- Modify: `src/components/AvatarCropModal.jsx`

- [ ] **Step 1：新增 `produceBase64` 函式**

在 component 內，handler 區塊之後加入：

```jsx
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
```

- [ ] **Step 2：把「完成」按鈕的 onClick 改成輸出 base64**

把：
```jsx
<button onClick={() => onConfirm(null)}>
```

改為：
```jsx
<button onClick={() => onConfirm(produceBase64())}>
```

- [ ] **Step 3：lint**

```bash
npx eslint src/components/AvatarCropModal.jsx
```
預期：無 error。

- [ ] **Step 4：commit**

```bash
git add src/components/AvatarCropModal.jsx
git commit -m "feat: output cropped 128x128 webp base64 from AvatarCropModal"
```

---

### Task 5：Dashboard 整合 — state、file input、modal、頭像渲染

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Step 1：新增 import**

把現有第 1 行：
```jsx
import { useEffect, useState } from 'react'
```

改為：
```jsx
import { useEffect, useRef, useState } from 'react'
```

並在 `import { db } from '../firebase'` 之後加入：

```jsx
import AvatarCropModal from '../components/AvatarCropModal'
import { getProfile, saveAvatar } from '../utils/profileSettings'
```

- [ ] **Step 2：新增 state 與 ref**

在 `const [memoryPhotos, setMemoryPhotos] = useState([])` 之後加入：

```jsx
const [avatarBase64, setAvatarBase64] = useState(null)
const [cropFile, setCropFile] = useState(null)
const fileInputRef = useRef(null)
```

- [ ] **Step 3：在 `useEffect` 內載入 profile**

把現有 `useEffect(() => { async function load() { ... } load() }, [])` 內 `try` 區塊的最後（`setMemoryPhotos(memories)` 之後、`} catch` 之前）加入：

```jsx
const profile = await getProfile()
setAvatarBase64(profile.avatarBase64)
```

- [ ] **Step 4：新增 handler**

在 `useEffect` 之後、`const now = new Date()` 之前加入：

```jsx
function openPicker() {
  fileInputRef.current?.click()
}

function onFileChosen(e) {
  const file = e.target.files?.[0]
  if (file) setCropFile(file)
  e.target.value = ''
}

async function handleConfirm(base64) {
  if (!base64) { setCropFile(null); return }
  try {
    await saveAvatar(base64)
    setAvatarBase64(base64)
  } catch (err) {
    console.error('saveAvatar failed', err)
    alert('儲存失敗，請重試')
    return
  }
  setCropFile(null)
}

async function handleReset() {
  try {
    await saveAvatar(null)
    setAvatarBase64(null)
  } catch (err) {
    console.error('saveAvatar(null) failed', err)
    alert('還原失敗，請重試')
    return
  }
  setCropFile(null)
}

function handleCancel() {
  setCropFile(null)
}
```

- [ ] **Step 5：改寫頭像 JSX**

找到：
```jsx
<div className="cat-avatar">🐱</div>
```

改為：
```jsx
<div className="cat-avatar" onClick={openPicker} style={{ cursor: 'pointer', overflow: 'hidden' }}>
  {avatarBase64
    ? <img src={avatarBase64} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    : '🐱'}
</div>
<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  onChange={onFileChosen}
  style={{ display: 'none' }}
/>
```

- [ ] **Step 6：在 component return 的最外層 div 內最後（`</div>` 之前）掛載 modal**

找到 Dashboard return 最外層 `<div className="min-h-full" ...>` 的最後一個 `</div>`（檔案結尾倒數第二行），在它之前加：

```jsx
{cropFile && (
  <AvatarCropModal
    imageFile={cropFile}
    onConfirm={handleConfirm}
    onCancel={handleCancel}
    onReset={handleReset}
  />
)}
```

- [ ] **Step 7：lint**

```bash
npx eslint src/pages/Dashboard.jsx
```
預期：無 error。

- [ ] **Step 8：commit**

```bash
git add src/pages/Dashboard.jsx
git commit -m "feat: wire avatar upload + crop modal into Dashboard"
```

---

### Task 6：手動端對端驗證

**Files:** 不修改檔案

- [ ] **Step 1：啟動 dev server**

```bash
npm run dev
```

- [ ] **Step 2：開啟瀏覽器 `http://localhost:5173`**

- [ ] **Step 3：依序驗證以下項目**

每項打勾確認通過：

- [ ] 點頭像跳出系統選檔
- [ ] 選一張**橫圖**：照片短邊填滿圓形、左右可拖曳但不能露白邊
- [ ] 選一張**直圖**：短邊填滿、上下可拖曳但不能露白邊
- [ ] 滾輪向上：照片放大；向下：縮小回到 minScale 後不再縮小
- [ ] 拖曳到極限位置：照片邊不會露出圓內
- [ ] 按「完成」：modal 關閉，Dashboard 頭像即時變成新圖
- [ ] 重新整理頁面：頭像仍是上傳的圖（驗證 Firestore 持久化）
- [ ] 再次點頭像、選另一張圖、完成：頭像覆蓋成新圖
- [ ] 點頭像 → 選圖 → 按「還原預設」：頭像回到 🐱 emoji，重新整理仍是 🐱
- [ ] 點頭像 → 選圖 → 按「取消」：頭像不變、modal 關閉

- [ ] **Step 4：手機/觸控驗證（可選但建議）**

打開 Chrome DevTools 切換到行動裝置模擬，重複拖曳測試（用滑鼠模擬單指）。雙指縮放需要實機，若有 iPhone/Android 可以連同網段測試 `http://<電腦IP>:5173`。

- [ ] **Step 5：若全數通過，最終 commit**

如果驗證過程修了任何小 bug，記得 commit。沒修就略過。

```bash
git status
# 確認 working tree clean
```
