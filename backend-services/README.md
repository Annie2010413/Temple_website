# Temple Services Backend

線上點燈申請的後端代理。前端送到這裡 → 後端驗證 + 加 secret → 轉送到 Google Apps Script → 寫入 Google Sheet。

廟方的查詢後台（Apps Script `doGet`）完全不受影響。

## 路由

- `GET  /api/health` — 健康檢查
- `POST /api/light/apply` — 點燈申請

## 本機開發

```bash
cd backend-services
cp .env.example .env
# 編輯 .env 填入 LIGHT_APPS_SCRIPT_URL、LIGHT_SHARED_SECRET
npm install
npm run dev
```

打開 http://localhost:5502/api/health 應該看到 `{"ok":true,...}`

## 部署到 Render

1. **建立 Web Service**
   - 進 https://dashboard.render.com → New → Web Service
   - 連你的 GitHub → 選 `Temple_website` repo
   - 設定：
     - Name: `temple-services-backend`（或你想要的）
     - Branch: `project`（建議用 project 不要綁 Peggy）
     - Root Directory: `backend-services`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Instance Type: Free

2. **設定環境變數（Environment → Add Environment Variable）**

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `LIGHT_APPS_SCRIPT_URL` | 你的 Apps Script 部署網址 |
   | `LIGHT_SHARED_SECRET` | 一段 32+ 字元隨機字串（請用密碼產生器產） |
   | `CORS_ORIGIN` | `https://sanchong-haichinggong.com` |

3. **拿到網址後**
   - Render 會給你一個 `https://temple-services-backend.onrender.com`
   - 把這個網址貼到 `services/light/index.html` 的 `API_BASE`
   - commit 推上去，GitHub Pages 會自動更新前端

4. **同步設定 Apps Script**
   - Apps Script 編輯器 → 專案設定 → 指令碼屬性
   - 新增屬性：`LIGHT_SHARED_SECRET` = 與 Render 上一樣的值
   - 部署 → 管理部署 → 新版本 → 部署
   - （Apps Script 網址不變，所以前端的設定也不用再改）

## 免費版注意事項

Render 免費版閒置 15 分鐘會睡眠，第一次請求會慢 5-30 秒（俗稱「冷啟動」）。對於點燈這種「每天幾次」的低流量服務沒問題；如果有人在拜拜時剛好按下送出按鈕，會看到 loading 久一點。

如果要避免冷啟動：用 [UptimeRobot](https://uptimerobot.com) 每 5 分鐘戳一次 `/api/health` 即可。

## 資料流

```
[使用者] → POST /api/light/apply (JSON, 純文字)
            ↓
[Express] 速率限制 → 格式驗證 → 加上 _secret
            ↓
[Apps Script doPost] 驗 secret → 寫入 Google Sheet
            ↓
[Google Sheet] ← 廟方從另一個 Apps Script doGet 後台查詢
```
