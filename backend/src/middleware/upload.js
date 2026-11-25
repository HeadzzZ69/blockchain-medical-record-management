const multer = require("multer");

// Use memory storage so we have immediate access to the Buffer for SHA-256 and AES-256-GCM encryption
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow PDF, JPG, JPEG, PNG
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file format. Only PDF, JPG, and PNG are allowed."), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter,
});

module.exports = upload;
