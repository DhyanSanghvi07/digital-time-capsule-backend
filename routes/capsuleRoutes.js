const express = require("express");
const router = express.Router();

const {
  createCapsule,
  getUserCapsules,
  getCapsuleById,
} = require("../controllers/capsuleController");

const protect = require("../middleware/authMiddleware");

router.get("/", protect, getUserCapsules);
router.get("/:id", protect, getCapsuleById);

const upload = require("../middleware/uploadMiddleware");
router.post("/", protect, upload.array("media", 5), createCapsule);


module.exports = router;
