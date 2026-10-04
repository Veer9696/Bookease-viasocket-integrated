const { Router } = require("express");
const rateLimit = require("express-rate-limit");
const authController = require("../controllers/auth.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/requireAuth");
const { registerSchema, loginSchema } = require("../validators/auth.schema");

const router = Router();

// Healthcare auth endpoints get a tighter rate limit than the rest of the API.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

router.post("/register", authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post("/login", authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post("/logout", asyncHandler(authController.logout));
router.get("/me", requireAuth, asyncHandler(authController.me));

module.exports = router;
