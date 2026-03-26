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
    reminderSent: {
      type: Boolean,
     default: false,
      },
     theme: {
      type: String,
      default: "classic",
    },
    media: [
      {
        type: { type: String, required: true },
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        caption: { type: String, default: "" },
        captionColor: { type: String, default: "#ffffff" },
        reaction: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Capsule", capsuleSchema);
