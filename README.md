# 嬛嬛日記 — 雜誌風 UI 改造

把這個資料夾的內容**整個複製覆蓋**到你本機的 `huan_huan/` 對應位置，結構是鏡像的。

## 改了哪些檔案

```
index.html                          ← 換字型 (Fraunces / Manrope / JetBrains Mono)
src/index.css                       ← 配色 token + body 預設
src/components/Layout.jsx           ← 新刊頭 + 浮動 bottom nav
src/components/NavIcon.jsx          ← 新增：手繪可愛 icon
src/components/Card.jsx             ← 紙白卡片
src/components/PageHeader.jsx       ← 內頁返回列
src/components/EmptyState.jsx       ← 統一空狀態
src/pages/Dashboard.jsx             ← 首頁雜誌風
src/pages/Expenses.jsx              ← 花費頁雜誌風
src/pages/Diet.jsx                  ← 飲食頁雜誌風
src/pages/Health.jsx                ← 健康頁雜誌風
src/pages/Reports.jsx               ← 報表頁雜誌風
```

## 設計系統

- **底色**：奶油白 `#FBF6F1`
- **墨色**：暖棕黑 `#3A2E2E` / `#6E5A5A` / `#B5A3A3`
- **Accent**：低飽和馬卡龍粉 `oklch(0.88 0.05 15)` + 玫瑰粉 `oklch(0.78 0.06 25)`
- **字型**：
  - `Fraunces`（serif，大標 + italic）
  - `Manrope`（sans，內文）
  - `JetBrains Mono`（kicker、數字、日期）

## 部署步驟（在你本機跑）

```bash
cd huan_huan
# 1) 複製本資料夾的內容覆蓋進去（你已經做了）

# 2) 確認本機跑得起來
npm run dev

# 3) 沒問題就提交 + 部署
git add -A
git commit -m "feat: redesign UI to magazine style (cream + macaron pink)"
git push origin main
npm run deploy
```

## 沒動到的檔案

- `firebase.js`、`utils/*`、表單頁（`*New*.jsx`）— 邏輯沒改
- `BottomNav.jsx` 已被新 `Layout.jsx` 取代，可以刪掉或留著
