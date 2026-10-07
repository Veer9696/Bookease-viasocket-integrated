const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { registerSchema, loginSchema, googleSignupSchema } = require("../validators/auth.schema");

const { env } = require("../config/env");

const router = Router();

// Healthcare auth endpoints get a tighter rate limit in production.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 20 : 1000,
});

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", requireAuth, asyncHandler(authController.me));

router.get("/google", authLimiter, asyncHandler(authController.googleStart));
router.get("/google/callback", authLimiter, asyncHandler(authController.googleCallback));
router.get("/google/pending", asyncHandler(authController.googlePending));
router.post(
  "/google/complete",
  authLimiter,
  requireFetchHeader,
  validate(googleSignupSchema),
  asyncHandler(authController.googleComplete)
);

module.exports = router;
