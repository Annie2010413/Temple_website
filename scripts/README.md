# 圖片優化腳本

解謎遊戲素材（`services/puzzle/pages/challenge/assets/`）體積大時，部署後載入會變慢。請在更新 PNG/JPG 原圖後執行：

```bash
cd Temple_website
npm install
npm run optimize:images
```

會產生：

- `**/*.webp`：依用途壓縮（關卡圖約 1280px、AR 約 1920px、道具約 512px）
- `picture/thumbs/*.webp`：地圖卡片用縮圖（約 480px）

HTML／JSON 已改為引用 `.webp` 與 `thumbs/`。請將產生的 WebP **一併 commit 並部署**。

原圖 PNG 可保留在 repo 供下次重新產生 WebP，確認無誤後也可刪除原圖以縮小倉庫。
