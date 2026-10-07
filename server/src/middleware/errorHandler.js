const { ApiError } = require("../utils/apiError");
const { logger } = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({ error: "Route not found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err && err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large (max 10 MB)" : err.message;
    return res.status(400).json({ error: message });
  }

  if (err && err.code === "P2002") {
    return res.status(409).json({ error: "That slot was just taken. Please pick another." });
  }

  logger.error(err);
  res.status(500).json({ error: "Internal server error" });
}

module.exports = { notFoundHandler, errorHandler };
