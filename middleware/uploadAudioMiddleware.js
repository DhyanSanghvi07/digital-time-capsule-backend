const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const audioStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "digital-time-capsule/audio",
    resource_type: "video", // IMPORTANT
    allowed_formats: ["mp3", "wav", "m4a"],
  },
});

const uploadAudio = multer({
  storage: audioStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB (perfect for audio)
  },
});

module.exports = uploadAudio;
