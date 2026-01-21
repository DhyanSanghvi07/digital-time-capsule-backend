const Capsule = require("../models/Capsule");

// @desc    Create a new capsule
// @route   POST /api/capsules
// @access  Private
const createCapsule = async (req, res) => {
  try {
    const { title, message, unlockDate } = req.body;

    if (!title || !message || !unlockDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const capsule = await Capsule.create({
      user: req.user._id,
      title,
      message,
      unlockDate,
      isUnlocked: false,
    });

    res.status(201).json({
      message: "Capsule sealed successfully!",
      capsuleId: capsule._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all capsules for logged-in user
// @route   GET /api/capsules
// @access  Private
const getUserCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({
      user: req.user._id,
    }).sort({ unlockDate: 1 });

    const now = new Date();

    const formattedCapsules = capsules.map((capsule) => {
      const unlockTime = new Date(capsule.unlockDate);

      return {
        _id: capsule._id,
        title: capsule.title,
        unlockDate: capsule.unlockDate,
        status: now < unlockTime ? "locked" : "unlocked",
      };
    });

    res.status(200).json(formattedCapsules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get single capsule (locked/unlocked)
// @route   GET /api/capsules/:id
// @access  Private
const getCapsuleById = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule) {
      return res.status(404).json({ message: "Capsule not found" });
    }

    // Ownership check
    if (capsule.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const now = new Date();
    const unlockTime = new Date(capsule.unlockDate);

    // Locked capsule
    if (now < unlockTime) {
      return res.status(200).json({
        status: "locked",
        unlockDate: capsule.unlockDate,
        remainingTime: unlockTime - now, // milliseconds
        message: "This memory is waiting for the right moment…",
      });
    }

    // Unlock capsule if not already unlocked
    if (!capsule.isUnlocked) {
      capsule.isUnlocked = true;
      await capsule.save();
    }

    // Unlocked capsule
    res.status(200).json({
      status: "unlocked",
      title: capsule.title,
      message: capsule.message,
      unlockDate: capsule.unlockDate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCapsule,
  getUserCapsules,
  getCapsuleById,
};
