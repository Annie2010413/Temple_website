# 圖片優化腳本

網站與解謎遊戲的 PNG/JPG 體積大時，部署後載入會變慢。更新原圖後請執行：

```bash
cd Temple_website
npm install
npm run optimize:images
```

## 指令

| 指令 | 範圍 |
|------|------|
| `npm run optimize:images` | 解謎 + 官網（全部） |
| `npm run optimize:puzzle-images` | 僅 `services/puzzle/.../assets/` |
| `npm run optimize:site-images` | 官網：`photos/`、`web_picture/`、線上服務頁等 |

## 產出

**解謎**（`optimize:puzzle-images`）

- `**/*.webp`：關卡約 1280px、AR 約 1920px、道具約 512px
- `picture/thumbs/*.webp`：地圖卡片約 480px

**官網**（`optimize:site-images`）

- `photos/`、`web_picture/`：神明照約 960px，首頁 hero 約 1920px
- `news_picture/`、活動圖：約 800px
- `services/{light,fortune,worship,signup}/`：UI 圖示約 512px，樓層地圖約 1600px
- 根目錄 `committee.webp`

執行 `optimize:site-images` 會一併把 HTML/CSS/JS 中的 `.png`/`.jpg` 路徑改為 `.webp`。

請將產生的 WebP **一併 commit 並部署**。原圖可保留供下次重新產生，確認無誤後也可刪除以縮小倉庫。
