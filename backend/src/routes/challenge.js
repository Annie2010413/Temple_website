const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const Progress = require("../models/Progress");

const router = express.Router();
const MAX_STORY = 7;
const MAX_CHALLENGE = 5;
const ANSWERS = {
  1: "1738",
  2: "1321",
  3: "明斷心",
  4: "3142756",
  5: "正義昭明"
};

function normalizeAnswer(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function readOptionalUserId(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    return payload.userId || null;
  } catch (_error) {
    return null;
  }
}

router.post("/submit", async (req, res) => {
  const stage = Number(req.body?.stage);
  const answer = normalizeAnswer(req.body?.answer);
  const expected = normalizeAnswer(ANSWERS[stage]);

  if (!Number.isInteger(stage) || stage < 1 || stage > MAX_CHALLENGE) {
    return res.status(400).json({ error: "Invalid stage" });
  }
  if (!answer) {
    return res.status(400).json({ error: "Missing answer" });
  }

  if (answer !== expected) {
    return res.json({ correct: false });
  }

  const unlockedChallenge = Math.min(stage + 1, MAX_CHALLENGE);
  const unlockedStory = stage >= MAX_CHALLENGE ? MAX_STORY : stage + 1;
  const userId = readOptionalUserId(req);

  if (!userId) {
    return res.json({
      correct: true,
      unlockedStory,
      unlockedChallenge
    });
  }

  const existing = await Progress.findOne({ userId });
  const merged = {
    unlockedStory: Math.min(MAX_STORY, Math.max(existing?.unlockedStory || 1, unlockedStory)),
    unlockedChallenge: Math.min(MAX_CHALLENGE, Math.max(existing?.unlockedChallenge || 1, unlockedChallenge))
  };

  const progress = await Progress.findOneAndUpdate(
    { userId },
    { $set: merged },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({
    correct: true,
    unlockedStory: progress.unlockedStory,
    unlockedChallenge: progress.unlockedChallenge
  });
});

module.exports = router;
