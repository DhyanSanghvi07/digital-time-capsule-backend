const express = require("express");
const router = express.Router();

const {
  createCapsule,
  getUserCapsules,
  getCapsuleById,
  addVideoToCapsule,
} = require("../controllers/capsuleController");

const protect = require("../middleware/authMiddleware");
const uploadImage = require("../middleware/uploadMiddleware");
const uploadVideo = require("../middleware/uploadVideoMiddleware");

router.post("/", protect, uploadImage.array("media", 5), createCapsule);

router.get("/", protect, getUserCapsules);

router.get("/:id", protect, getCapsuleById);

router.post(
  "/:id/videos",
  protect,
  uploadVideo.array("videos", 2),
  addVideoToCapsule,
);

const uploadAudio = require("../middleware/uploadAudioMiddleware");
const { addAudioToCapsule } = require("../controllers/capsuleController");

router.post(
  "/:id/audio",
  uploadAudio.array("audio", 3),
  protect,
  addAudioToCapsule,
);

module.exports = router;
