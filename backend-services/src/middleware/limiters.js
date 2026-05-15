const rateLimit = require("express-rate-limit");

// 一般 API：每 IP 每分鐘 30 次
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "請求過於頻繁，請稍後再試" }
});

// 點燈申請：每 IP 每 10 分鐘 5 次（防 spam）
const lightApplyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "申請過於頻繁，請稍後再試或來電洽詢" }
});

module.exports = { generalLimiter, lightApplyLimiter };
