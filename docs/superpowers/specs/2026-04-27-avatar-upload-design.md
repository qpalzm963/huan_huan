# 首頁頭像上傳與裁切

**日期：** 2026-04-27
**狀態：** 待實作

## 背景

Dashboard 目前的圓形頭像（Dashboard.jsx:252）是 CSS 漸層底 + 🐱 emoji，無法個人化。需求是讓使用者點頭像即可上傳自己的照片，並在上傳前以 Instagram 式的圓形遮罩 + 拖曳/縮放決定要顯示哪一塊。

## 範圍

- 點 Dashboard 頭像 → 開系統選檔 → 裁切 modal → 寫回 Firestore → 即時顯示
- 支援「還原預設」回到原本的 🐱 emoji
- 跨裝置同步（資料存 Firestore）
- 頭像目前只在 Dashboard 出現一處（grep 確認），不需修改其他頁面

非範圍：

- 多個個人資料欄位（暱稱、主題色等）— 留待未來擴充
- 保留原圖以便重新裁切 — 只存最終 128x128 縮圖

## 使用流程

```
首頁 → 點頭像
  ↓
觸發隱藏的 <input type="file" accept="image/*">
  ↓ 選好照片
彈出全螢幕裁切 modal（黑底）
  ├ 正方形 stage：圓形透明遮罩 + 照片
  ├ 拖曳平移、滾輪/雙指縮放
  └ 按鈕：[還原預設] [取消] [完成]
  ↓ 按「完成」
Canvas 裁切 → 128x128 webp → base64
  ↓
寫入 Firestore: settings/profile { avatarBase64, updatedAt }
  ↓
Dashboard 即時更新顯示新圖
```

特殊路徑：

- 「取消」→ modal 關閉，不變更
- 「還原預設」→ 寫入 `avatarBase64: null`，Dashboard 回到 🐱 emoji
- 沒拖曳/縮放就完成 → 用初始置中、短邊填滿的裁切

## 元件拆解

### 1. `src/components/AvatarCropModal.jsx`（新檔）

**Props：**

- `imageFile: File` — 剛從 input 取得的圖片檔
- `onConfirm(base64: string): void` — 完成時回傳裁切後的 base64
- `onCancel(): void` — 關閉 modal
- `onReset(): void` — 還原預設（清除 Firestore 上的 avatarBase64）

**內部 state：**

- `scale: number` — 縮放倍數，範圍 `minScale` ~ `minScale * 4`
- `offset: { x: number, y: number }` — 照片相對 stage 中心的位移

**初始化（img onLoad）：**

- `minScale = max(stageSize / img.naturalWidth, stageSize / img.naturalHeight)` —— 讓短邊剛好填滿
- `scale = minScale`、`offset = (0, 0)`

**互動：**

- 拖曳（pointermove）：累加 delta 到 offset，每次 setState 後做邊界 clamp
- 縮放（wheel + 雙指 pinch）：依 deltaY 或雙指距離調 scale，clamp 在範圍內，並重新 clamp offset
- 邊界 clamp 規則：照片任一邊都不能露出圓形遮罩內側（避免出現白邊）

**輸出（onConfirm）：**

- 建立 128x128 離屏 canvas
- 換算來源座標 `sx, sy, sWidth, sHeight` 對應目前 transform
- `ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 128, 128)`
- `canvas.toDataURL('image/webp', 0.85)` → 5~15KB base64

**設計原則：**

- 完全不依賴 Firestore — 純粹「給檔案、回 base64」，可重用於其他裁圖場景

### 2. `src/utils/profileSettings.js`（新檔）

```js
export async function getProfile() {
  // doc('settings/profile') → { avatarBase64?: string|null }
}

export async function saveAvatar(base64OrNull) {
  // setDoc('settings/profile', { avatarBase64, updatedAt: serverTimestamp() }, { merge: true })
}
```

把 Firestore 讀寫包起來，未來新增 profile 欄位（暱稱、主題色…）可在這裡擴充。

### 3. `src/pages/Dashboard.jsx`（修改）

**新增 state：**

- `avatarBase64: string | null`
- `cropFile: File | null` — 選到檔案後設置，開啟 modal

**新增邏輯：**

- mount 時 `getProfile()` 載入 `avatarBase64`
- 點 `.cat-avatar` → 觸發隱藏的 `<input ref>`
- input `onChange` → `setCropFile(e.target.files[0])`
- modal `onConfirm(base64)` → `await saveAvatar(base64)` + `setAvatarBase64(base64)` + `setCropFile(null)`
- modal `onReset` → `await saveAvatar(null)` + `setAvatarBase64(null)` + `setCropFile(null)`
- modal `onCancel` → `setCropFile(null)`

**頭像渲染：**

```jsx
<div className="cat-avatar" onClick={openPicker}>
  {avatarBase64
    ? <img src={avatarBase64} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
    : '🐱'}
</div>
```

## 資料層

**Firestore 路徑：** `settings/profile`

**文件結構：**

```ts
{
  avatarBase64: string | null,  // data:image/webp;base64,... 或 null（預設）
  updatedAt: Timestamp
}
```

**為何選 Firestore base64 而非 Storage：**

- 128x128 webp 約 5~15KB，遠低於 Firestore 1MB 文件上限
- 省一次 Storage upload + getDownloadURL 來回
- 跨裝置自動同步，不需處理 URL 過期/CORS

## 裁切座標換算

stage 邊長為 `S`（CSS 像素，例如 360）。輸出 canvas 為 128x128。

照片 transform：`translate(offset.x, offset.y) scale(scale)`，原點為照片中心，照片中心初始對齊 stage 中心。

來源座標換算：

- 顯示在 stage 中央的那個正方形，對應到原圖座標：
  - `sWidth = sHeight = S / scale`
  - `sx = (img.naturalWidth - sWidth) / 2 - offset.x / scale`
  - `sy = (img.naturalHeight - sHeight) / 2 - offset.y / scale`

換算邏輯只在 `onConfirm` 用一次，實作時以實機測試對齊結果為準。

## 錯誤處理

- 選檔後讀圖失敗（壞檔/格式不支援）→ 顯示 toast「無法讀取此圖片」，關閉 modal
- Firestore 寫入失敗 → 顯示 toast「儲存失敗，請重試」，保留 modal 不關閉
- 載入 profile 失敗 → 靜默 fallback 到 🐱 emoji，console.error 記錄

## 測試計畫

手動驗證（dev server 開啟後）：

- [ ] 點頭像跳出選檔
- [ ] 選一張橫圖：短邊填滿、可左右拖曳、不能拖出白邊
- [ ] 選一張直圖：短邊填滿、可上下拖曳、不能拖出白邊
- [ ] 滾輪縮放在 1x ~ 4x 範圍內
- [ ] 雙指縮放（手機/觸控）
- [ ] 完成後 Dashboard 頭像即時更新
- [ ] 重新整理頁面，頭像仍是新圖（驗證 Firestore 持久化）
- [ ] 換一張圖再次裁切，覆蓋成功
- [ ] 按「還原預設」回到 🐱 emoji，重新整理仍是 🐱
- [ ] 按「取消」不變更頭像
