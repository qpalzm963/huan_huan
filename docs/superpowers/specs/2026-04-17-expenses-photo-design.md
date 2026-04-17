# 花費紀錄照片功能設計

**日期：** 2026-04-17  
**範疇：** ExpensesNew.jsx（新增表單）、Expenses.jsx（列表顯示）

---

## 需求

每筆花費紀錄支援上傳一張商品照片（選填），所有分類（食品、醫療、用品、其他）均可使用。

---

## 架構

### Firestore schema

`expenses` 文件新增選填欄位：

```
photo?: {
  url: string   // Firebase Storage 公開下載網址
  path: string  // Storage 路徑，供刪除用
}
```

無照片的舊記錄不受影響（欄位不存在即視為無照片）。

### Firebase Storage 路徑

```
expenses/{timestamp}.webp
```

---

## ExpensesNew.jsx 變更

**新增 state：**
- `photo`: `{ file: Blob, preview: string } | null`
- `uploadProgress`: `number`（0–100）

**新增 ref：**
- `fileRef`：隱藏的 `<input type="file">` 元素

**照片選取流程：**
1. 使用者點擊照片框 → 觸發 `fileRef.current.click()`
2. 選取圖片後呼叫 `compressImage(file, 1920, 0.85)`
3. 以 `URL.createObjectURL` 產生預覽，存入 `photo` state

**UI（備註欄下方）：**
- 未選照片：虛線框 + `ImagePlus` 圖示 + 「新增照片」文字
- 已選照片：預覽圖 + 右上角 `×` 移除按鈕（清除 `photo` state）

**送出流程（handleSubmit）：**
1. 若 `photo` 存在：上傳至 `expenses/{Date.now()}.webp`，追蹤 `uploadProgress`
2. 取得 `downloadURL`
3. Firestore addDoc 加入 `photo: { url, path }` 欄位
4. 按鈕文字：上傳中顯示「上傳中 XX%」，無照片時維持「儲存中...」

---

## Expenses.jsx 變更

**列表 row：**
- 若 `exp.photo?.url` 存在，在分類圓點左側顯示 40×40 圓角縮圖
- 無照片的 row 樣式不變

**刪除（handleDelete）：**
- 現有：`deleteDoc`
- 新增：若 `exp.photo?.path` 存在，同步呼叫 `deleteObject(ref(storage, exp.photo.path))`
- Storage 刪除失敗不阻斷主流程（try/catch 靜默處理，與 Photos.jsx 一致）

---

## 改動範圍

| 檔案 | 變更類型 |
|------|----------|
| `src/pages/ExpensesNew.jsx` | 新增照片 state、UI 區塊、上傳邏輯 |
| `src/pages/Expenses.jsx` | 新增縮圖顯示、刪除時清 Storage |

不需要新增路由、新頁面或修改 Firestore rules（Storage rules 已支援）。
