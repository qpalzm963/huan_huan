# 嬛嬛日記

嬛嬛的生活記錄 app，追蹤飲食、健康、花費和照片。

## 功能

- **首頁** — 本月花費、快速導覽、一年前的今天回顧
- **花費記帳** — 分類記錄、月份分組
- **飲食日誌** — 早晚餐內容與份量
- **健康紀錄** — 體重、預防保健（疫苗/驅蟲）、看診
- **照片日記** — 標籤、Lightbox 滑動瀏覽
- **購物清單** — 待購項目、勾選完成、轉記帳
- **品牌管理** — 常用品牌與產品、歷史價格追蹤
- **報表** — 月花費趨勢、分類統計、體重折線圖

## 技術棧

- React + Vite + Tailwind CSS
- Firebase Firestore + Storage
- PWA（可安裝至手機主畫面）
- 部署：GitHub Pages

## 本地開發

```bash
npm install
cp .env.example .env   # 填入 Firebase 設定
npm run dev
npm run deploy         # 部署至 GitHub Pages
```

## 環境變數

參考 `.env.example`，填入 Firebase 專案的設定值。

## 安全性

Firebase Web API Key 為公開識別碼（非 secret），安全性由 Security Rules 管理。Storage 限制僅接受圖片（5MB 以下）；Firestore 限制單筆文件欄位數。建議後續加入 Firebase Authentication 與 App Check。
