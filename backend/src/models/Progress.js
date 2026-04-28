const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    unlockedStory: { type: Number, default: 1, min: 1 },
    unlockedChallenge: { type: Number, default: 1, min: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Progress", progressSchema);
