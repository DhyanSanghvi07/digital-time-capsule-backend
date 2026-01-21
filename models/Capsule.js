const mongoose = require("mongoose");

const capsuleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    unlockDate: {
      type: Date,
      required: true,
    },

    isUnlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Capsule = mongoose.model("Capsule", capsuleSchema);

module.exports = Capsule;
