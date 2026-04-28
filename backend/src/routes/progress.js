const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const Progress = require("../models/Progress");

const router = express.Router();
const MAX_STORY = 7;
const MAX_CHALLENGE = 5;

function clampProgress(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || min));
}

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
  const nextStory = clampProgress(req.body?.unlockedStory, 1, MAX_STORY);
  const nextChallenge = clampProgress(req.body?.unlockedChallenge, 1, MAX_CHALLENGE);

  const existing = await Progress.findOne({ userId });
  const merged = {
    unlockedStory: clampProgress(Math.max(existing?.unlockedStory || 1, nextStory), 1, MAX_STORY),
    unlockedChallenge: clampProgress(Math.max(existing?.unlockedChallenge || 1, nextChallenge), 1, MAX_CHALLENGE)
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
