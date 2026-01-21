const express = require("express");
const router = express.Router();

const {
  createCapsule,
  getUserCapsules,
  getCapsuleById,
} = require("../controllers/capsuleController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, createCapsule);
router.get("/", protect, getUserCapsules);
router.get("/:id", protect, getCapsuleById);

module.exports = router;
