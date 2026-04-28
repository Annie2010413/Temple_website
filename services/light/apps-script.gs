/**
 * 三重海清宮包公廟 — 線上點燈 表單接收 Apps Script
 *
 * 部署步驟（第一次使用時做一次就好）：
 *  1. 打開你的 Google Sheet：
 *     https://docs.google.com/spreadsheets/d/1eSQu31o3fjDcFXpGAsMTZ_vLduzGHBuJMaOoKLx5YLE/edit
 *  2. 上方選單：擴充功能 → Apps Script
 *  3. 把這個檔案整份貼進去，覆蓋原本的 Code.gs
 *  4. 執行一次 `setupSheet` 函式（會寫入標題列並把手機/匯款後五碼欄設為文字格式）
 *     → 第一次執行會要求授權，按「允許」即可
 *  5. 點右上角「部署」→「新增部署作業」
 *     - 類型：網頁應用程式
 *     - 執行身分：我（你的帳號）
 *     - 誰可以存取：所有人
 *     - 按「部署」，複製「網頁應用程式網址」
 *  6. 把網址貼到 index.html 裡的 SCRIPT_URL 變數
 *
 *  之後如果修改這份程式碼，要重新部署（部署 → 管理部署 → 編輯 → 新版本）
 */

const SHEET_ID = '1eSQu31o3fjDcFXpGAsMTZ_vLduzGHBuJMaOoKLx5YLE';
const SHEET_NAME = '工作表1'; // 若你的分頁名稱不同，改這裡

const HEADERS = [
  '申請時間', '申請編號', '申請人姓名', '燈種', '出生年月日',
  '住址', '手機號碼', 'Email', '匯款後五碼', '金額',
  '是否收到匯款', '是否寄送確認信'
];

/** 第一次使用時手動執行 */
function setupSheet() {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  // 手機號碼（G欄）、匯款後五碼（I欄）設為純文字，避免首位0被吃掉
  sheet.getRange('G:G').setNumberFormat('@');
  sheet.getRange('I:I').setNumberFormat('@');
}

/**
 * 找到第一個真正空白的資料列
 * （不用 appendRow，因為試算表已預放勾選框，會把 lastRow 推到很後面）
 */
function findFirstEmptyRow(sheet) {
  // 以 A 欄（申請時間）為基準判斷
  const maxRows = sheet.getMaxRows();
  const values = sheet.getRange(2, 1, maxRows - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) {
    if (values[i][0] === '' || values[i][0] === null) {
      return i + 2; // 因為從第 2 列開始找
    }
  }
  return maxRows + 1;
}

/** 接收前端 POST 送來的點燈申請 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

    const now = new Date();
    const timestamp = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy-MM-dd HH:mm:ss');
    const orderId = 'L' + Utilities.formatDate(now, 'Asia/Taipei', 'yyyyMMddHHmmss');

    const row = findFirstEmptyRow(sheet);

    // 只寫入 A~J 欄（前 10 欄），K/L 欄（勾選框）完全不動
    sheet.getRange(row, 1, 1, 10).setValues([[
      timestamp,
      orderId,
      data.name || '',
      data.lamp || '',
      data.birthday || '',
      data.address || '',
      "'" + (data.phone || ''),         // 加單引號前綴，強制純文字，保留開頭0
      data.email || '',
      "'" + (data.transferCode || ''),  // 同上
      600
    ]]);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, orderId: orderId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** 測試用：瀏覽部署網址時會看到這個訊息，代表部署成功 */
function doGet() {
  return ContentService.createTextOutput('三重海清宮線上點燈 API 運作中');
}
