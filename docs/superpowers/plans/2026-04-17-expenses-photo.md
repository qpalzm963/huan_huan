# Expenses Photo Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓每筆花費紀錄可選填一張商品照片，新增時上傳、列表時顯示縮圖、刪除時清理 Storage。

**Architecture:** 在 `ExpensesNew.jsx` 的表單最下方（備註欄之後）加入照片選取區塊，送出時壓縮後上傳 Firebase Storage，URL/path 存入 Firestore `expenses` 文件的 `photo` 欄位。`Expenses.jsx` 列表讀取 `photo.url` 顯示縮圖，刪除時一併清除 Storage 物件。

**Tech Stack:** React, Firebase Storage (`uploadBytesResumable`, `getDownloadURL`, `deleteObject`), `compressImage` utility, `lucide-react` (ImagePlus icon)

---

### Task 1：ExpensesNew.jsx — 新增照片 state、ref、壓縮選取邏輯

**Files:**
- Modify: `src/pages/ExpensesNew.jsx`

- [ ] **Step 1：新增 import**

在 `ExpensesNew.jsx` 頂部現有 import 之後加入：

```jsx
import { useRef } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'
import { ImagePlus } from 'lucide-react'
import { compressImage } from '../utils/compressImage'
```

現有第 1 行已有 `import { useState } from 'react'`，改為：

```jsx
import { useState, useRef } from 'react'
```

- [ ] **Step 2：在 component 內新增 state 與 ref**

在 `const [error, setError] = useState('')` 之後加入：

```jsx
const [photo, setPhoto] = useState(null) // { file: Blob, preview: string } | null
const [uploadProgress, setUploadProgress] = useState(0)
const fileRef = useRef(null)
```

- [ ] **Step 3：新增照片選取 handler**

在 `function set(...)` 之後加入：

```jsx
async function handlePhoto(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const compressed = await compressImage(file, 1920, 0.85)
  setPhoto({ file: compressed, preview: URL.createObjectURL(compressed) })
  e.target.value = ''
}

function removePhoto() {
  setPhoto(null)
}
```

- [ ] **Step 4：commit**

```bash
git add src/pages/ExpensesNew.jsx
git commit -m "feat(expenses): add photo state and compress handler"
```

---

### Task 2：ExpensesNew.jsx — 上傳邏輯整合進 handleSubmit

**Files:**
- Modify: `src/pages/ExpensesNew.jsx`

- [ ] **Step 1：新增上傳 helper function**

在 `handlePhoto` 之後加入：

```jsx
async function uploadPhoto() {
  const path = `expenses/${Date.now()}.webp`
  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, photo.file)
  await new Promise((resolve, reject) => {
    task.on('state_changed',
      snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
      reject,
      resolve
    )
  })
  const url = await getDownloadURL(storageRef)
  return { url, path }
}
```

- [ ] **Step 2：修改 handleSubmit 在 addDoc 前上傳照片**

將現有 `handleSubmit` 內的 `try` 區塊從：

```jsx
try {
  await addDoc(collection(db, 'expenses'), {
    name: form.name.trim(),
    amount: Number(form.amount),
    category: form.category,
    date: form.date,
    note: form.note.trim(),
    createdAt: Timestamp.now(),
  })
  navigate('/expenses')
} catch (e) {
  setError('儲存失敗，請再試一次')
  setSaving(false)
}
```

改為：

```jsx
try {
  const photoData = photo ? await uploadPhoto() : null
  await addDoc(collection(db, 'expenses'), {
    name: form.name.trim(),
    amount: Number(form.amount),
    category: form.category,
    date: form.date,
    note: form.note.trim(),
    ...(photoData && { photo: photoData }),
    createdAt: Timestamp.now(),
  })
  navigate('/expenses')
} catch (e) {
  setError('儲存失敗，請再試一次')
  setSaving(false)
}
```

- [ ] **Step 3：更新按鈕文字**

將現有：

```jsx
{saving ? '儲存中...' : '儲存紀錄'}
```

改為：

```jsx
{saving && photo && uploadProgress < 100 ? `上傳中 ${uploadProgress}%` : saving ? '儲存中...' : '儲存紀錄'}
```

- [ ] **Step 4：commit**

```bash
git add src/pages/ExpensesNew.jsx
git commit -m "feat(expenses): upload photo to Storage on submit"
```

---

### Task 3：ExpensesNew.jsx — 照片選取 UI 區塊

**Files:**
- Modify: `src/pages/ExpensesNew.jsx`

- [ ] **Step 1：在備註欄的 `</div>` 之後、error 訊息之前加入照片區塊**

找到：

```jsx
        {error && <p className="text-sm text-red-500">{error}</p>}
```

在它之前插入：

```jsx
        {/* Photo */}
        <div>
          <label className="text-xs font-semibold text-[#7BAEC8] uppercase tracking-wide">
            商品照片（選填）
          </label>
          <div className="mt-2">
            {photo ? (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#B0D8EE]">
                <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold leading-none"
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => !saving && fileRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-[#B0D8EE] bg-white flex flex-col items-center justify-center cursor-pointer active:opacity-70 text-[#7BAEC8]"
              >
                <ImagePlus size={22} />
                <span className="text-xs mt-1 font-semibold">新增照片</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhoto}
          />
        </div>
```

- [ ] **Step 2：在瀏覽器確認 UI**

啟動 dev server（若未啟動）：

```bash
npm run dev
```

前往 `/expenses/new`，確認：
- 備註欄下方出現「商品照片（選填）」虛線框
- 點擊框後彈出系統相簿選取
- 選取後顯示預覽圖（24×24 方形）
- 點 × 可移除

- [ ] **Step 3：commit**

```bash
git add src/pages/ExpensesNew.jsx
git commit -m "feat(expenses): add photo picker UI to new expense form"
```

---

### Task 4：Expenses.jsx — 縮圖顯示 + 刪除時清 Storage

**Files:**
- Modify: `src/pages/Expenses.jsx`

- [ ] **Step 1：新增 Storage import**

在現有 import 中加入：

```jsx
import { ref, deleteObject } from 'firebase/storage'
import { storage } from '../firebase'
```

- [ ] **Step 2：修改 handleDelete 清除 Storage**

將現有：

```jsx
async function handleDelete(id) {
  if (!confirm('確定要刪除？')) return
  await deleteDoc(doc(db, 'expenses', id))
  setExpenses(prev => prev.filter(e => e.id !== id))
}
```

改為：

```jsx
async function handleDelete(exp) {
  if (!confirm('確定要刪除？')) return
  await deleteDoc(doc(db, 'expenses', exp.id))
  if (exp.photo?.path) {
    try { await deleteObject(ref(storage, exp.photo.path)) } catch {}
  }
  setExpenses(prev => prev.filter(e => e.id !== exp.id))
}
```

- [ ] **Step 3：在 row 中加入縮圖，並更新 handleDelete 呼叫**

找到列表 row 的 JSX：

```jsx
                  <div key={exp.id} className="ex-row">
                    <div className="ex-dot" style={{ background: COLORS[exp.category] || '#7BAEC8' }} />
                    <div className="ex-info">
                      <div className="ex-name">{exp.name}</div>
                      <div className="ex-sub">{CATEGORIES[exp.category]} · {exp.date?.slice(5)}</div>
                    </div>
                    <div className="ex-amount">${exp.amount?.toLocaleString()}</div>
                    <button className="ex-del" onClick={() => handleDelete(exp.id)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
```

改為：

```jsx
                  <div key={exp.id} className="ex-row">
                    {exp.photo?.url ? (
                      <img
                        src={exp.photo.url}
                        alt={exp.name}
                        style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div className="ex-dot" style={{ background: COLORS[exp.category] || '#7BAEC8' }} />
                    )}
                    <div className="ex-info">
                      <div className="ex-name">{exp.name}</div>
                      <div className="ex-sub">{CATEGORIES[exp.category]} · {exp.date?.slice(5)}</div>
                    </div>
                    <div className="ex-amount">${exp.amount?.toLocaleString()}</div>
                    <button className="ex-del" onClick={() => handleDelete(exp)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
```

- [ ] **Step 4：在瀏覽器確認 end-to-end 流程**

1. 前往 `/expenses/new`，新增一筆花費並附上照片
2. 送出後跳回 `/expenses`，確認該筆記錄左側顯示商品縮圖
3. 新增一筆無照片的花費，確認仍顯示分類圓點（樣式不變）
4. 刪除有照片的記錄，至 Firebase Console → Storage 確認 `expenses/` 下對應檔案已消失

- [ ] **Step 5：commit**

```bash
git add src/pages/Expenses.jsx
git commit -m "feat(expenses): show photo thumbnail in list and clean up Storage on delete"
```
