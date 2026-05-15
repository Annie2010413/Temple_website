/**
 * 三重海清宮包公廟 — 線上活動報名 Apps Script
 *
 * ★ 這版只接受帶有正確 secret 的請求 ★
 * 前端不再直接打這個 URL，改打 Node 後端 → Node 後端帶 secret 進來
 *
 * ─────────── 設定步驟 ───────────
 * 1) 在 Apps Script 編輯器：左側齒輪「專案設定」→ 指令碼屬性 → 新增屬性
 *    名稱：SIGNUP_SHARED_SECRET
 *    數值：（與 Node 後端 .env 的 SIGNUP_SHARED_SECRET 完全一致，至少 32 字隨機字串）
 * 2) 部署 → 管理部署 → 編輯 → 新版本 → 部署
 * 3) 部署網址貼給 Peggy，她會加進後端環境變數
 */

const SHEET_ID = '1YTELG_BFbOGI6t0hfnDHruyH9OMYvY-gRpNB2gAqIQo';

function doPost(e) {
  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];

  try {
    var data = JSON.parse(e.postData.contents);

    // ── 1. 檢查 secret ──
    var expected = PropertiesService.getScriptProperties().getProperty('SIGNUP_SHARED_SECRET');
    if (!expected || data._secret !== expected) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ── 2. 必填欄位再檢查 ──
    var requiredFields = ['applyTime', 'applyId', 'activityType', 'name', 'birthday', 'address', 'phone', 'transferCode', 'amount'];
    for (var i = 0; i < requiredFields.length; i++) {
      if (!data[requiredFields[i]]) {
        return ContentService
          .createTextOutput(JSON.stringify({ success: false, error: 'Missing field: ' + requiredFields[i] }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    var rowData = [
      data.applyTime,                  // A 申請時間
      data.applyId,                    // B 申請編號
      '',                              // C Line ID（網站送出無）
      data.activityType,               // D 活動類型
      data.name,                       // E 申請人姓名
      data.birthday,                   // F 出生年月日
      data.address,                    // G 住址
      "'" + data.phone,                // H 手機號碼（前綴 ' 保留開頭 0）
      data.idNumber || '',             // I 身分證字號
      data.email || '',                // J Email
      "'" + data.transferCode,         // K 匯款後五碼
      Number(data.amount),             // L 金額
      false,                           // M 是否收到匯款
      false,                           // N 是否寄送確認信
      '',                              // O 通知方式
      '',                              // P 確認收款時間
      '',                              // Q 寄送時間
      ''                               // R 寄送結果
    ];

    sheet.appendRow(rowData);
    var newRow = sheet.getLastRow();
    sheet.getRange(newRow, 13, 1, 2).insertCheckboxes(); // M、N 欄勾選框

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, applyId: data.applyId }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/** 測試用 */
function doGet() {
  return ContentService.createTextOutput('活動報名 API 運作中');
}
