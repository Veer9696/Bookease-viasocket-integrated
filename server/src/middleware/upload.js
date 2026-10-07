const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { BadRequestError } = require("../utils/apiError");

const defaultUploadBase = process.env.VERCEL
  ? path.join("/tmp", "uploads")
  : path.join(__dirname, "..", "..", "uploads");
const UPLOAD_DIR = path.join(process.env.UPLOAD_DIR || defaultUploadBase, "reports");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = {
  "application/pdf": ".pdf",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  // Random names so the stored filename never leaks the patient's original
  // filename and can't be guessed.
  filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${ALLOWED_TYPES[file.mimetype]}`),
});

const uploadReport = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES[file.mimetype]) return cb(new BadRequestError("Only PDF, PNG or JPG files are allowed"));
    cb(null, true);
  },
}).single("report");

module.exports = { uploadReport, UPLOAD_DIR };
