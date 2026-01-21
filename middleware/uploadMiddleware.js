const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "digital-time-capsule/images",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ quality: "auto" }],
  },
});

const upload = multer({ storage });

module.exports = upload;
