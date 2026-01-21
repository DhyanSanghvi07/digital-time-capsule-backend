const Capsule = require("../models/Capsule");

// CREATE CAPSULE
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
    });

    res.status(201).json(capsule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER CAPSULES
const getUserCapsules = async (req, res) => {
  try {
    const capsules = await Capsule.find({ user: req.user._id }).sort({
      unlockDate: 1,
    });

    const now = new Date();

    const formatted = capsules.map((capsule) => ({
      _id: capsule._id,
      title: capsule.title,
      unlockDate: capsule.unlockDate,
      status: now < capsule.unlockDate ? "locked" : "unlocked",
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE CAPSULE
const getCapsuleById = async (req, res) => {
  try {
    const capsule = await Capsule.findById(req.params.id);

    if (!capsule)
      return res.status(404).json({ message: "Capsule not found" });

    if (capsule.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const now = new Date();

    if (now < capsule.unlockDate) {
      return res.status(200).json({
        status: "locked",
        unlockDate: capsule.unlockDate,
        message: "This memory is waiting for the right moment…",
      });
    }

    if (!capsule.isUnlocked) {
      capsule.isUnlocked = true;
      await capsule.save();
    }

    res.status(200).json({
      status: "unlocked",
      title: capsule.title,
      message: capsule.message,
      media: capsule.media,
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
