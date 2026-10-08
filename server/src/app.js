const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { env, isEnvValid, envErrors } = require("./config/env");
const apiRouter = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
if (env.CLIENT_ORIGIN) {
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
}
app.use(express.json());
app.use(cookieParser());

// Serverless configuration guard: returns actionable error instead of container crash
app.use("/api", (req, res, next) => {
  if (req.path === "/health") {
    return next();
  }
  if (!isEnvValid) {
    return res.status(503).json({
      error: "Service Configuration Incomplete",
      message: "The backend server is missing required environment variables in Vercel.",
      missing: Object.keys(envErrors || {}),
      help: "Please configure DATABASE_URL, JWT_SECRET, and VIASOCKET_* in your Vercel Dashboard -> Settings -> Environment Variables, then redeploy.",
    });
  }
  next();
});

app.use("/api", apiRouter);

// Serve the built React SPA in production; client-side routes fall back to
// index.html, API routes never do (that 404 is handled below instead).
const clientDist = path.join(__dirname, "..", "..", "client", "dist");
app.use(express.static(clientDist));
app.get(/^(?!\/api).*/, (req, res, next) => {
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.use("/api", notFoundHandler);
app.use(errorHandler);

module.exports = { app };
