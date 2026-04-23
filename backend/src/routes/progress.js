const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const Progress = require("../models/Progress");

const router = express.Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const userId = req.user.userId;
  let progress = await Progress.findOne({ userId });

  if (!progress) {
    progress = await Progress.create({
      userId,
      unlockedStory: 1,
      unlockedChallenge: 1
    });
  }

  return res.json({
    unlockedStory: progress.unlockedStory,
    unlockedChallenge: progress.unlockedChallenge,
    updatedAt: progress.updatedAt
  });
});

router.put("/", async (req, res) => {
  const userId = req.user.userId;
  const nextStory = Math.max(1, Number(req.body?.unlockedStory) || 1);
  const nextChallenge = Math.max(1, Number(req.body?.unlockedChallenge) || 1);

  const existing = await Progress.findOne({ userId });
  const merged = {
    unlockedStory: Math.max(existing?.unlockedStory || 1, nextStory),
    unlockedChallenge: Math.max(existing?.unlockedChallenge || 1, nextChallenge)
  };

  const progress = await Progress.findOneAndUpdate(
    { userId },
    { $set: merged },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return res.json({
    unlockedStory: progress.unlockedStory,
    unlockedChallenge: progress.unlockedChallenge,
    updatedAt: progress.updatedAt
  });
});

module.exports = router;
