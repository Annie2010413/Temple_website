const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { progressReadLimiter, progressWriteLimiter } = require("../middleware/limiters");
const { progressCache } = require("../util/progress-cache");
const Progress = require("../models/Progress");

const router = express.Router();

router.use(authMiddleware);

router.get("/", progressReadLimiter, async (req, res) => {
  const userId = String(req.user.userId);

  const cached = progressCache.get(userId);
  if (cached) {
    res.set("Cache-Control", "private, max-age=10");
    res.set("X-Cache", "HIT");
    return res.json(cached);
  }

  let progress = await Progress.findOne({ userId });
  if (!progress) {
    progress = await Progress.create({
      userId,
      unlockedStory: 1,
      unlockedChallenge: 1
    });
  }

  const payload = {
    unlockedStory: progress.unlockedStory,
    unlockedChallenge: progress.unlockedChallenge,
    updatedAt: progress.updatedAt
  };
  progressCache.set(userId, payload);

  res.set("Cache-Control", "private, max-age=10");
  res.set("X-Cache", "MISS");
  return res.json(payload);
});

router.put("/", progressWriteLimiter, async (_req, res) => {
  return res.status(403).json({
    error: "Direct progress updates are disabled. Complete challenges to advance."
  });
});

module.exports = router;
