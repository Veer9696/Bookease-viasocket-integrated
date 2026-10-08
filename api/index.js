const { app } = require("../server/src/app");

module.exports = (req, res) => {
  // Normalize req.url if rewritten without /api
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
};
