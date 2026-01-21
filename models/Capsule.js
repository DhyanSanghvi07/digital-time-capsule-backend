const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    unlockDate: { type: Date, required: true },
    isUnlocked: { type: Boolean, default: false },
    media: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Capsule", capsuleSchema);
