const express = require("express");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const config = require("../config");
const User = require("../models/User");

const router = express.Router();
const googleClient = new OAuth2Client(config.googleClientId);

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: "Missing idToken" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.googleClientId
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email) {
      return res.status(400).json({ error: "Invalid Google token payload" });
    }

    const user = await User.findOneAndUpdate(
      { googleSub: payload.sub },
      {
        $set: {
          email: payload.email,
          name: payload.name || "",
          avatar: payload.picture || ""
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar
      }
    });
  } catch (error) {
    return res.status(401).json({
      error: "Google authentication failed",
      message: error.message
    });
  }
});

module.exports = router;
