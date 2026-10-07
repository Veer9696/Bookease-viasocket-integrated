const { Router } = require("express");
const { z } = require("zod");
const analyticsController = require("../controllers/analytics.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = Router();

router.get(
  "/summary",
  requireAuth,
  requireRole("DOCTOR"),
  validate(z.object({ range: z.enum(["week", "month"]).default("week") }), "query"),
  asyncHandler(analyticsController.summary)
);

module.exports = router;
