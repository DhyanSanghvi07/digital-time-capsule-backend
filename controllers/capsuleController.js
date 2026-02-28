const mongoose = require("mongoose");
const Capsule = require("../models/Capsule");
const { successResponse, errorResponse } = require("../utils/response");
const { MAX_MEDIA } = require("../config/limits");


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

// HARDENING: fix unlock state based on time
const ensureCapsuleUnlockState = async (capsule) => {
  if (!capsule.isUnlocked && new Date() >= capsule.unlockDate) {
    capsule.isUnlocked = true;
    await capsule.save();
  }
  return capsule;
};

// ObjectId safety
const validateObjectId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    errorResponse(res, 400, "Invalid capsule ID", "BAD_REQUEST");
    return false;
  }
  return true;
};

/* =========================
   CREATE CAPSULE
========================= */

const createCapsule = async (req, res) => {
  try {
    const { title, message, unlockDate } = req.body;

    if (!title || !message || !unlockDate) {
      return errorResponse(
        res,
        400,
        "Title, message, and unlockDate are required",
        "BAD_REQUEST"
      );
    }

    const parsedDate = new Date(unlockDate);

    if (isNaN(parsedDate.getTime())) {
      return errorResponse(res, 400, "Invalid unlockDate format", "BAD_REQUEST");
    }

    if (parsedDate <= new Date()) {
      return errorResponse(
        res,
        400,
        "unlockDate must be in the future",
        "BAD_REQUEST"
      );
    }

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
      unlockDate: parsedDate,
      media,
      isUnlocked: false,
    });

    return successResponse(res, 201, capsule);
  } catch (error) {
    return errorResponse(res, 500, error.message, "SERVER_ERROR");
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

    return successResponse(res, 200, formatted, {
      count: formatted.length,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message, "SERVER_ERROR");
  }
};

/* =========================
   GET SINGLE CAPSULE
========================= */

const getCapsuleById = async (req, res) => {
  if (!validateObjectId(req.params.id, res)) return;

  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return errorResponse(res, 404, "Capsule not found", "NOT_FOUND");
    }

    if (capsule.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "Not authorized", "FORBIDDEN");
    }

    if (new Date() < capsule.unlockDate) {
  return successResponse(res, 200, {
    status: "locked",
    isLocked: true,
    title: capsule.title,   
    unlockDate: capsule.unlockDate,
    unlocksIn: getRemainingTime(capsule.unlockDate),
    message: "This memory is waiting for the right moment…",
  });
}

    await ensureCapsuleUnlockState(capsule);

    return successResponse(res, 200, {
      status: "unlocked",
      isLocked: false,
      title: capsule.title,
      message: capsule.message,
      media: capsule.media,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message, "SERVER_ERROR");
  }
};

/* =========================
   ADD VIDEOS
========================= */

const addVideoToCapsule = async (req, res) => {
  if (!validateObjectId(req.params.id, res)) return;

  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return errorResponse(res, 404, "Capsule not found", "NOT_FOUND");
    }

    if (capsule.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "Not authorized", "FORBIDDEN");
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, "No videos uploaded", "BAD_REQUEST");
    }

    const existingVideos = capsule.media.filter(
      (m) => m.type === "video"
    ).length;

    if (existingVideos + req.files.length > MAX_MEDIA.video) {
      return errorResponse(
        res,
        413,
        "Video limit exceeded",
        "LIMIT_EXCEEDED"
      );
    }

    if (capsule.media.length + req.files.length > MAX_MEDIA.total) {
      return errorResponse(
        res,
        413,
        "Total media limit exceeded",
        "LIMIT_EXCEEDED"
      );
    }

    for (const file of req.files) {
      if (!file.mimetype.startsWith("video/")) {
        return errorResponse(res, 400, "Invalid video file", "BAD_REQUEST");
      }
    }

    const videos = req.files.map((file) => ({
      type: "video",
      url: file.path,
      publicId: file.filename,
    }));

    capsule.media.push(...videos);
    await capsule.save();

    return successResponse(res, 200, {
      message: "Video(s) added successfully",
      added: videos,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message, "SERVER_ERROR");
  }
};

/* =========================
   ADD AUDIO
========================= */

const addAudioToCapsule = async (req, res) => {
  if (!validateObjectId(req.params.id, res)) return;

  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return errorResponse(res, 404, "Capsule not found", "NOT_FOUND");
    }

    if (capsule.user.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, "Not authorized", "FORBIDDEN");
    }

    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 400, "No audio files uploaded", "BAD_REQUEST");
    }

    const existingAudio = capsule.media.filter(
      (m) => m.type === "audio"
    ).length;

    if (existingAudio + req.files.length > MAX_MEDIA.audio) {
      return errorResponse(
        res,
        413,
        "Audio limit exceeded",
        "LIMIT_EXCEEDED"
      );
    }

    if (capsule.media.length + req.files.length > MAX_MEDIA.total) {
      return errorResponse(
        res,
        413,
        "Total media limit exceeded",
        "LIMIT_EXCEEDED"
      );
    }

    for (const file of req.files) {
      if (!file.mimetype.startsWith("audio/")) {
        return errorResponse(res, 400, "Invalid audio file", "BAD_REQUEST");
      }
    }

    const audioFiles = req.files.map((file) => ({
      type: "audio",
      url: file.path,
      publicId: file.filename,
    }));

    capsule.media.push(...audioFiles);
    await capsule.save();

    return successResponse(res, 201, {
      message: "Audio added successfully",
      added: audioFiles,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message, "SERVER_ERROR");
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
