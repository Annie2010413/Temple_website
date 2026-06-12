# 三重海清宮包公廟 — 官方網站

靜態官網（首頁、線上服務、廟宇地圖）與 **實境解謎遊戲**（`services/puzzle/`）的前端專案。解謎的 Google 登入與進度同步需搭配 `backend/` 的 Express API 與 MongoDB。

---

## 專案結構

```
Temple_website/
├── index.html              # 官網首頁
├── style.css               # 官網全站樣式
├── js/news.js              # 最新消息資料
├── photos/                 # 神明照片
├── web_picture/            # 首頁去背圖、hero 背景
├── services/
│   ├── puzzle/             # 實境解謎（關卡、故事、AR/QR）
│   │   └── js/
│   │       ├── runtime-config.js   # API 位址切換（本機 / 正式）
│   │       └── auth-config.js      # 選用，本機 Google Client ID（gitignore）
│   ├── light/              # 線上點燈
│   ├── signup/             # 活動報名
│   ├── worship/            # 線上參拜
│   └── fortune/            # 線上求籤
├── backend/                # 解謎 API（登入、進度、關卡驗證）
├── backend-services/       # 點燈／報名代理（Apps Script，與解謎分開）
└── scripts/                # 圖片 WebP 優化腳本
```

更細的後端 API 說明見 [`backend/docs/README.md`](backend/docs/README.md)。

---

## 第一次設定

### 1. 建立 `backend/.env`

`.env` **不會**被 Git 追蹤（見根目錄 `.gitignore`）。請從範本複製後自行填入：

**Windows（PowerShell）**

```powershell
cd backend
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cd backend
cp .env.example .env
```

編輯 `backend/.env`，至少填好下列欄位：

| 變數 | 說明 |
|------|------|
| `PORT` | 本機 API 埠號，預設 `5501`（需與前端 `runtime-config.js` 的 `LOCAL_API_BASE` 一致） |
| `MONGO_URI` | MongoDB Atlas 連線字串 |
| `JWT_SECRET` | 簽發登入 token 用的長隨機字串（勿外流） |
| `GOOGLE_CLIENT_ID` | Google Cloud「網頁應用程式」OAuth Client ID |
| `CORS_ORIGIN` | 前端來源，本機用 Live Server 時建議 `http://127.0.0.1:5500`（若埠不同請改為實際網址） |

範例（`.env.example`）：

```env
PORT=5501
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
GOOGLE_CLIENT_ID=replace_with_google_web_client_id.apps.googleusercontent.com
CORS_ORIGIN=http://127.0.0.1:5500
```

### 2. `backend-services/.env`

僅在本地開發 **線上點燈**、**活動報名** 的 Apps Script 代理時需要。同樣複製 `backend-services/.env.example` → `backend-services/.env` 並填入。與解謎後端無關。

### 3. （選用）`services/puzzle/js/auth-config.js`

若不想改 `runtime-config.js` 裡的 `GOOGLE_CLIENT_ID`，可複製範本：

```powershell
Copy-Item services\puzzle\js\auth-config.example.js services\puzzle\js\auth-config.js
```

此檔已被 gitignore，僅供本機覆寫 Client ID。

---

## 本機開發：啟動後端

在專案根目錄開終端機：

```powershell
cd backend
npm install
npm run dev
```

成功後應看到服務監聽 `http://localhost:5501`（或你在 `.env` 設的 `PORT`）。

**健康檢查：** 瀏覽器或 curl 開啟

```
http://localhost:5501/api/health
```

應回傳 `{"ok":true,...}`。

正式環境部署在 Render 時，前端預設連 `https://temple-website-wmxr.onrender.com`，無需在本機跑後端。

---

## 本機開發：前端與 API 切換

解謎頁面透過 `services/puzzle/js/runtime-config.js` 決定要連本機還是正式 API。

```js
// true  → http://localhost:5501
// false → https://temple-website-wmxr.onrender.com
const LOCAL_FLAG = true;
```

| 情境 | `LOCAL_FLAG` |
|------|----------------|
| 本機除錯後端、MongoDB、登入 | `true` |
| 預覽正式 API、或準備部署靜態站 | `false` |

修改後存檔，重新整理解謎頁面即可。也可在 HTML 裡於 `state.js` 之前覆寫（優先於 `LOCAL_FLAG`）：

```html
<script>window.PUZZLE_API_BASE = "http://localhost:5501";</script>
```

### 用 Live Server 開官網／解謎

1. VS Code 安裝 **Live Server** 擴充功能  
2. 對根目錄 `index.html` 右鍵 → **Open with Live Server**  
3. 確認 `backend/.env` 的 `CORS_ORIGIN` 與 Live Server 網址一致（常見為 `http://127.0.0.1:5500`）  
4. 確認 `LOCAL_FLAG = true` 且後端 `npm run dev` 已在跑  

**請勿** 用 `file://` 直接開 HTML，否則 `fetch`、登入與 JSON 載入會失敗。

### 建議的本機流程

1. 終端 A：`cd backend` → `npm run dev`  
2. 修改 `runtime-config.js`：`LOCAL_FLAG = true`  
3. Live Server 開啟首頁 

---

## 解謎相關 API（摘要）

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/api/auth/google` | Google ID token 換 JWT |
| `GET` | `/api/progress` | 讀取雲端進度（需 Bearer token） |
| `POST` | `/api/challenge/submit` | 提交答案；答對才推進進度 |

---

## 圖片優化（選用）

大量 PNG/JPG 會拖慢載入。更新原圖後可在根目錄執行：

```bash
npm install
npm run optimize:images
```

詳見 [`scripts/README.md`](scripts/README.md)。

---

## 維護官網內容

### 新增最新消息

編輯 `js/news.js`，在 `NEWS` 陣列**最前面**新增一筆：

```js
{
  date: "2026/04/01",
  category: "活動",        // 公告 | 活動 | 慶典 | 其他
  title: "標題",
  content: "內文，可用 \\n 換行",
  image: "news_picture/xxx.webp"  // 無圖可填 ""
}
```

### 修改首頁文案

直接編輯 `index.html`；樣式在 `style.css`。

---

## 部署注意

- **靜態檔**（HTML/CSS/JS/圖片）：GitHub Pages、Netlify 或自架靜態主機；部署前將 `runtime-config.js` 的 `LOCAL_FLAG` 設為 `false`。  
- **解謎後端**：部署 `backend/` 至 Render（或同類平台），環境變數與本機 `.env` 相同概念。  
- **勿 commit**：`backend/.env`、`backend-services/.env`、`services/puzzle/js/auth-config.js`（已在 `.gitignore`）。

---

## 常見問題

**驗證失敗 / 無法登入**  
確認後端已啟動、`LOCAL_FLAG` 與實際 API 一致、`GOOGLE_CLIENT_ID` 與 Google Console 授權網域包含 Live Server 網址。

**CORS 錯誤**  
調整 `backend/.env` 的 `CORS_ORIGIN`，使其與瀏覽器網址列的 origin 完全一致（含 `http`/`https`、主機、埠號）。