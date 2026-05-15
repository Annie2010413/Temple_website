const express = require("express");
const config = require("../config");
const { signupApplyLimiter } = require("../middleware/limiters");

const router = express.Router();

const ACTIVITY_RULES = {
  "南巡進香": { amount: 2800, fixed: true, needId: true },
  "平安餐":   { amount: 500,  fixed: true, needId: false },
  "拜斗登記": { amount: null, fixed: false, needId: false, min: 1000, max: 60000 }
};

const TW_ID_RE = /^[A-Z][0-9]{9}$/;

function validate(data) {
  const errors = [];
  if (!data || typeof data !== "object") return ["請提供有效資料"];

  const rule = ACTIVITY_RULES[data.activityType];
  if (!rule) errors.push("活動類型無效");

  if (!data.name || data.name.length < 1 || data.name.length > 30) errors.push("姓名格式錯誤");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthday || "")) errors.push("出生年月日格式錯誤");
  if (!data.address || data.address.length < 5 || data.address.length > 100) errors.push("住址格式錯誤");
  if (!/^09\d{8}$/.test(data.phone || "")) errors.push("手機號碼格式錯誤");

  if (rule && rule.needId) {
    if (!TW_ID_RE.test(data.idNumber || "")) errors.push("身分證字號格式錯誤");
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Email 格式錯誤");
  if (!/^\d{5}$/.test(data.transferCode || "")) errors.push("匯款後五碼格式錯誤");

  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push("金額不合理");
  } else if (rule) {
    if (rule.fixed && amount !== rule.amount) errors.push(`此活動金額應為 ${rule.amount}`);
    if (!rule.fixed && (amount < rule.min || amount > rule.max)) {
      errors.push(`此活動金額需在 ${rule.min}~${rule.max} 之間`);
    }
  }

  return errors;
}

router.post("/apply", signupApplyLimiter, async (req, res) => {
  try {
    const data = req.body;
    const errors = validate(data);
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }

    // 後端產生申請時間 / 申請編號（不信任前端帶進來的）
    const now = new Date();
    const tw = new Date(now.getTime() + 8 * 3600 * 1000); // 簡單 +8 模擬台北時區
    const pad = (n) => String(n).padStart(2, "0");
    const applyTime = `${tw.getUTCFullYear()}/${pad(tw.getUTCMonth() + 1)}/${pad(tw.getUTCDate())} ${pad(tw.getUTCHours())}:${pad(tw.getUTCMinutes())}:${pad(tw.getUTCSeconds())}`;
    const applyId = "SJ" + String(tw.getUTCFullYear()).slice(-2)
      + pad(tw.getUTCMonth() + 1)
      + pad(tw.getUTCDate())
      + pad(tw.getUTCHours())
      + pad(tw.getUTCMinutes());

    const rule = ACTIVITY_RULES[data.activityType];

    const payload = {
      _secret: config.signup.sharedSecret,
      applyTime,
      applyId,
      activityType: data.activityType,
      name: data.name.trim(),
      birthday: data.birthday,
      address: data.address.trim(),
      phone: data.phone,
      idNumber: rule.needId ? data.idNumber : "",
      email: (data.email || "").trim(),
      transferCode: data.transferCode,
      amount: Number(data.amount)
    };

    const upstream = await fetch(config.signup.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    if (!upstream.ok) {
      console.error("Signup Apps Script 回應非 2xx:", upstream.status);
      return res.status(502).json({ success: false, error: "上游服務暫時無回應" });
    }

    return res.json({ success: true, applyId });
  } catch (err) {
    console.error("signup/apply error:", err);
    return res.status(500).json({ success: false, error: "伺服器錯誤" });
  }
});

module.exports = router;
