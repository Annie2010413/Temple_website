/**
 * 三重海清宮包公廟 — 線上點燈 Apps Script
 *
 * ★ 這版只接受帶有正確 secret 的請求 ★
 * 前端不再直接打這個 URL，改打 Node 後端 → Node 後端帶 secret 進來
 *
 * ─────────── 設定步驟 ───────────
 * 1) 在 Apps Script 編輯器：專案設定 → 指令碼屬性 → 新增屬性
 *    名稱：LIGHT_SHARED_SECRET
 *    數值：（與 Node 後端 .env 的 LIGHT_SHARED_SECRET 完全一致，至少 32 字隨機字串）
 * 2) 部署 → 管理部署 → 新版本 → 部署
 * 3) 部署網址貼到 Node 後端 .env 的 LIGHT_APPS_SCRIPT_URL
 *
 *  — 廟方查詢用的 doGet 後台網址完全不變 —
 */

const SHEET_ID = '1eSQu31o3fjDcFXpGAsMTZ_vLduzGHBuJMaOoKLx5YLE';

function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

  try {
    var data = JSON.parse(e.postData.contents);

    // ── 1. 檢查 secret（沒帶或不對就拒絕） ──
    var expected = PropertiesService.getScriptProperties().getProperty('LIGHT_SHARED_SECRET');
    if (!expected || data._secret !== expected) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 2. 後端再驗一次基本欄位 ──
    var requiredFields = ['lamp', 'name', 'birthday', 'address', 'phone', 'transferCode', 'amount'];
    for (var i = 0; i < requiredFields.length; i++) {
      if (!data[requiredFields[i]]) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Missing field: ' + requiredFields[i] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // ── 3. 產生時間、編號 ──
    var now = new Date();
    var applyTime = Utilities.formatDate(now, 'Asia/Taipei', 'yyyy/MM/dd HH:mm:ss');
    var applyId = 'LD' + Utilities.formatDate(now, 'Asia/Taipei', 'yyMMddHHmm');

    var rowData = [
      applyTime,                              // A 申請時間
      applyId,                                // B 申請編號
      '',                                     // C Line ID（網站送出無）
      data.name,                              // D 申請人姓名
      data.lamp,                              // E 燈種
      data.birthday,                          // F 出生年月日
      data.address,                           // G 住址
      "'" + data.phone,                       // H 手機號碼（前綴 ' 保留開頭 0）
      data.email || '',                       // I Email
      "'" + data.transferCode,                // J 匯款後五碼
      Number(data.amount),                    // K 金額
      false,                                  // L 是否收到匯款
      false,                                  // M 是否寄送確認信
      '',                                     // N 通知方式
      '',                                     // O 確認收款時間
      '',                                     // P 寄送時間
      ''                                      // Q 寄送結果
    ];

    sheet.appendRow(rowData);
    var newRow = sheet.getLastRow();
    sheet.getRange(newRow, 12, 1, 2).insertCheckboxes(); // L、M 欄勾選框

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, orderId: applyId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** 測試用 */
function doGet() {
  return ContentService.createTextOutput('線上點燈 API 運作中');
}
