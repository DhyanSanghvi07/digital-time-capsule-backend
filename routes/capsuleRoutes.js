const express = require("express");
const router = express.Router();

const {
  createCapsule,
  getUserCapsules,
  getCapsuleById,
  addVideoToCapsule,
  deleteCapsule,
  updateCapsule,
} = require("../controllers/capsuleController");

const protect = require("../middleware/authMiddleware");
const uploadImage = require("../middleware/uploadMiddleware");
const uploadVideo = require("../middleware/uploadVideoMiddleware");

router.post("/", protect, uploadImage.array("media", 10), createCapsule);

router.get("/", protect, getUserCapsules);

router.get("/:id", protect, getCapsuleById);

router.put(
  "/:id",
  protect,
  uploadImage.array("media", 10), // allows replacing media
  updateCapsule
);
router.post(
  "/:id/videos",
  protect,
  uploadVideo.array("videos", 5),
  addVideoToCapsule,
);

const uploadAudio = require("../middleware/uploadAudioMiddleware");
const { addAudioToCapsule } = require("../controllers/capsuleController");

router.post(
  "/:id/audio",
  uploadAudio.array("audio", 5),
  protect,
  addAudioToCapsule,
);

router.delete(
  "/:id",protect,deleteCapsule
);

module.exports = router;
