const Capsule = require("../models/Capsule");

/* =========================
   UTILS
========================= */

// Human-readable remaining time
const getRemainingTime = (unlockDate) => {
  const now = new Date();
  const diffMs = unlockDate - now;

  if (diffMs <= 0) return null;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} month(s)`;
  if (days > 0) return `${days} day(s)`;
  if (hours > 0) return `${hours} hour(s)`;
  if (minutes > 0) return `${minutes} minute(s)`;
  return `${seconds} second(s)`;
};

// HARDENING: always fix unlock state based on time
const ensureCapsuleUnlockState = async (capsule) => {
  const now = new Date();

  if (!capsule.isUnlocked && now >= capsule.unlockDate) {
    capsule.isUnlocked = true;
    await capsule.save();
  }

  return capsule;
};

/* =========================
   CREATE CAPSULE
========================= */

const createCapsule = async (req, res) => {
  try {
    const { title, message, unlockDate } = req.body;

    const media = req.files
      ? req.files.map((file) => ({
          type: "image",
          url: file.path,
          publicId: file.filename,
        }))
      : [];

    const capsule = await Capsule.create({
      user: req.user._id,
      title,
      message,
      unlockDate,
      media,
      isUnlocked: false,
    });

    res.status(201).json({
      success: true,
      data: capsule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET USER CAPSULES
========================= */

const getUserCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({ user: req.user._id }).sort({
      unlockDate: 1,
    });

    const formatted = [];

    for (const capsule of capsules) {
      await ensureCapsuleUnlockState(capsule);

      const isLocked = new Date() < capsule.unlockDate;

      formatted.push({
        _id: capsule._id,
        title: capsule.title,
        unlockDate: capsule.unlockDate,
        status: isLocked ? "locked" : "unlocked",
        isLocked,
      });
    }

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   GET SINGLE CAPSULE
========================= */

const getCapsuleById = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res
        .status(404)
        .json({ success: false, message: "Capsule not found" });
    }

    // Ownership check
    if (capsule.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    // LOCKED STATE (pure time-based)
    if (new Date() < capsule.unlockDate) {
      return res.status(200).json({
        success: true,
        status: "locked",
        isLocked: true,
        unlockDate: capsule.unlockDate,
        unlocksIn: getRemainingTime(capsule.unlockDate),
        message: "This memory is waiting for the right moment…",
      });
    }

    // HARDENED AUTO-UNLOCK
    await ensureCapsuleUnlockState(capsule);

    // UNLOCKED STATE
    res.status(200).json({
      success: true,
      status: "unlocked",
      isLocked: false,
      title: capsule.title,
      message: capsule.message,
      media: capsule.media,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   ADD VIDEOS
========================= */

const addVideoToCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res
        .status(404)
        .json({ success: false, message: "Capsule not found" });
    }

    if (capsule.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No videos uploaded" });
    }

    const videos = req.files.map((file) => ({
      type: "video",
      url: file.path,
      publicId: file.filename,
    }));

    capsule.media.push(...videos);
    await capsule.save();

    res.status(200).json({
      success: true,
      message: "Video(s) added successfully",
      added: videos,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   ADD AUDIO
========================= */

const addAudioToCapsule = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res
        .status(404)
        .json({ success: false, message: "Capsule not found" });
    }

    if (capsule.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No audio files uploaded" });
    }

    const audioFiles = req.files.map((file) => ({
      type: "audio",
      url: file.path,
      publicId: file.filename,
    }));

    capsule.media.push(...audioFiles);
    await capsule.save();

    res.status(201).json({
      success: true,
      message: "Audio added successfully",
      added: audioFiles,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================
   EXPORTS
========================= */

module.exports = {
  createCapsule,
  getUserCapsules,
  getCapsuleById,
  addVideoToCapsule,
  addAudioToCapsule,
};
