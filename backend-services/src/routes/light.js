const express = require("express");
const config = require("../config");
const { lightApplyLimiter } = require("../middleware/limiters");

const router = express.Router();

const VALID_LAMPS = ["光明燈", "太歲燈", "財神燈", "契子燈"];

/**
 * 伺服器端再驗一次資料格式（前端的驗證可繞過，伺服器一定要驗）
 */
function validate(data) {
  const errors = [];
  if (!data || typeof data !== "object") {
    return ["請提供有效資料"];
  }
  if (!VALID_LAMPS.includes(data.lamp)) errors.push("燈種無效");
  if (!data.name || data.name.length < 1 || data.name.length > 30) errors.push("姓名格式錯誤");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthday || "")) errors.push("出生年月日格式錯誤");
  if (!data.address || data.address.length < 5 || data.address.length > 100) errors.push("住址格式錯誤");
  if (!/^09\d{8}$/.test(data.phone || "")) errors.push("手機號碼格式錯誤");
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("Email 格式錯誤");
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) errors.push("金額不合理");
  if (!/^\d{5}$/.test(data.transferCode || "")) errors.push("匯款後五碼格式錯誤");
  return errors;
}

router.post("/apply", lightApplyLimiter, async (req, res) => {
  try {
    const data = req.body;
    const errors = validate(data);
    if (errors.length) {
      return res.status(400).json({ success: false, errors });
    }

    // 把帶有 secret 的 payload forward 給 Apps Script
    const payload = {
      _secret: config.light.sharedSecret,
      lamp: data.lamp,
      name: data.name.trim(),
      birthday: data.birthday,
      address: data.address.trim(),
      phone: data.phone,
      email: (data.email || "").trim(),
      amount: Number(data.amount),
      transferCode: data.transferCode
    };

    const upstream = await fetch(config.light.appsScriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    if (!upstream.ok) {
      console.error("Apps Script 回應非 2xx:", upstream.status);
      return res.status(502).json({ success: false, error: "上游服務暫時無回應" });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("light/apply error:", err);
    return res.status(500).json({ success: false, error: "伺服器錯誤" });
  }
});

module.exports = router;
