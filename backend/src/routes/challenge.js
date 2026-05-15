const express = require("express");
const jwt = require("jsonwebtoken");
const config = require("../config");
const Progress = require("../models/Progress");
const { submitLimiter } = require("../middleware/limiters");
const { invalidateProgressCache } = require("../util/progress-cache");

const router = express.Router();
const MAX_STORY = 6;
const MAX_CHALLENGE = 5;
const ANSWERS = {
  1: "13",
  2: "靈願善心現",
  3: "23322333",
  4: "2",
  5: "BE6128"
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

router.post("/submit", submitLimiter, async (req, res) => {
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

  const userId = readOptionalUserId(req);
  if (userId) {
    const existing = await Progress.findOne({ userId });
    const allowedStage = Math.max(1, Number(existing?.unlockedChallenge) || 1);
    if (stage > allowedStage) {
      return res.status(403).json({ error: "Stage not unlocked" });
    }
  }

  const unlockedChallenge = Math.min(stage + 1, MAX_CHALLENGE);
  const unlockedStory = stage >= MAX_CHALLENGE ? MAX_STORY : stage + 1;

  if (!userId) {
    return res.json({
      correct: true,
      unlockedStory,
      unlockedChallenge
    });
  }

  const progressRecord = await Progress.findOne({ userId });
  const merged = {
    unlockedStory: Math.min(MAX_STORY, Math.max(progressRecord?.unlockedStory || 1, unlockedStory)),
    unlockedChallenge: Math.min(MAX_CHALLENGE, Math.max(progressRecord?.unlockedChallenge || 1, unlockedChallenge))
  };

  const progress = await Progress.findOneAndUpdate(
    { userId },
    { $set: merged },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  invalidateProgressCache(userId);

  return res.json({
    correct: true,
    unlockedStory: progress.unlockedStory,
    unlockedChallenge: progress.unlockedChallenge
  });
});

module.exports = router;
