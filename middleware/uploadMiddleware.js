const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resourceType = "image";

    if (file.mimetype.startsWith("video")) {
      resourceType = "video";
    }

    if (file.mimetype.startsWith("audio")) {
      resourceType = "video"; // Cloudinary stores audio as video
    }

    return {
      folder: "digital-time-capsule/media",
      resource_type: resourceType,
    };
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

module.exports = upload;