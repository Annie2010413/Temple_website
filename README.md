# 🏮 宮廟網站使用說明

## 📁 資料夾結構

```
temple-website/
├── index.html          ← 首頁（主要內容）
├── css/
│   └── style.css       ← 所有樣式
├── js/
│   ├── news.js         ← ⭐ 最新消息資料（主要維護這個）
│   └── main.js         ← 網站邏輯（一般不需修改）
├── images/             ← 放圖片的資料夾
└── pages/              ← 未來可新增的子頁面
```

---

## ✏️ 如何新增最新消息

打開 `js/news.js`，在 `NEWS = [` 的**最前面**新增一筆：

```js
const NEWS = [
  {
    date: "2026/04/01",          // 日期
    category: "活動",            // 公告 | 活動 | 慶典 | 其他
    title: "清明法會公告",        // 標題
    content: "詳細說明文字...",   // 內容（用 \n 換行）
    image: ""                    // 圖片路徑（暫不使用）
  },
  // ... 舊的消息保留在後面
];
```

存檔後重新整理瀏覽器即可看到最新消息出現在最上方。

---

## 🖋️ 如何修改廟名、介紹

打開 `index.html` 用 VSCode 搜尋（Ctrl+H）替換：

| 搜尋         | 替換成       |
|------------|------------|
| `萬善堂`      | 您的廟名      |
| `×× 縣...`  | 實際地址      |
| `×× 號公車`   | 實際交通資訊    |

---

## 🌐 如何上線

1. **免費靜態託管**：推薦 [GitHub Pages](https://pages.github.com/) 或 [Netlify](https://netlify.com/)
   - 將整個資料夾上傳即可，完全免費
2. **付費虛擬主機**：使用 FTP 將資料夾上傳到主機的 `public_html` 目錄

---

## 🔧 在本機預覽

安裝 VSCode 套件 **Live Server**，對 `index.html` 右鍵選「Open with Live Server」即可即時預覽。
