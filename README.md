# 嬛嬛日記 — Playful Cute UI 改造

把這個資料夾的內容**整個複製覆蓋**到你本機的 `huan_huan/` 對應位置，結構是鏡像的。

## 改了哪些檔案

```
index.html                          ← 加 Fredoka / Nunito / Caveat / JetBrains Mono / M PLUS Rounded 1c / Noto Sans TC
src/index.css                       ← Playful 配色 token + 字型 fallback
src/components/Layout.jsx           ← 浮動 sticker bottom nav (粗框 + offset 陰影)
src/components/NavIcon.jsx          ← 手繪可愛 icon
src/components/Card.jsx             ← sticker 卡片
src/components/PageHeader.jsx       ← 內頁返回列
src/components/EmptyState.jsx       ← 統一空狀態
src/pages/Dashboard.jsx             ← 首頁 (粉紅 hero + sticker quick log)
src/pages/Expenses.jsx              ← 花費 (peach hero + 彩色 chip)
src/pages/Diet.jsx                  ← 飲食 (mint 進度環 + 日期方塊)
src/pages/Health.jsx                ← 健康 (五色分頁 tab)
src/pages/Reports.jsx               ← 報表 (lilac 總覽 + 分類條)
src/pages/Brands.jsx                ← 品牌 (butter hero + 五星 sticker)
src/pages/Shopping.jsx              ← 清單 (三色統計 + 圓 checkbox)
```

## 設計系統（Playful Cute）

- **底色**：奶油白 `#FFF9F2` / 暖橘 `#FFEFE0`
- **墨色**：暖棕黑 `#3D2A2A` / `#7A5C5C` / `#C4A8A8`
- **馬卡龍六色**：
  - Pink `#FFC8D6` / Pink Deep `#FF92AE`
  - Peach `#FFD4B0` / Peach Deep `#FFA877`
  - Mint `#C8EBD9` / Mint Deep `#7FCCA6`
  - Butter `#FFE4A0` / Butter Deep `#F5C04D`
  - Lilac `#E0CFF2` / Lilac Deep `#B594D9`
  - Sky `#C8E0F2` / Sky Deep `#7FB3DB`
- **字型**：
  - `Fredoka` — 圓潤 display / 標題 / 數字
  - `Nunito` — 內文
  - `Caveat` — 手寫 accent (英文 only)
  - `JetBrains Mono` — kicker / 日期 / 金額
  - `M PLUS Rounded 1c` + `Noto Sans TC` — 中文 fallback (避免掉到標楷體)
- **Sticker 卡片**：`2px solid #3D2A2A` + `box-shadow: 0 4px 0 #3D2A2A` (大) / `0 2px 0 #3D2A2A` (小)

## 部署步驟（在你本機跑）

```bash
cd huan_huan
# 1) 複製本資料夾的內容覆蓋進去

# 2) 確認本機跑得起來
npm run dev

# 3) 沒問題就提交 + 部署
git add -A
git commit -m "feat: redesign UI to playful cute (sticker style + 馬卡龍配色)"
git push origin main
npm run deploy
```

## 沒動到的檔案

- `firebase.js`、`utils/*`、表單頁（`*New*.jsx`）、`AvatarCropModal` — 邏輯沒改
- `BottomNav.jsx` 已被新 `Layout.jsx` 取代

## 已知限制

- `Brands.jsx` 與 `Shopping.jsx` 保留了原本的 Firestore 邏輯（包含 `getCountFromServer`、`Timestamp` 等），只換樣式
- 如果你的 routing 還沒掛 `/brands`、`/shopping`，請確認 `App.jsx` 裡有對應的 `<Route>`
