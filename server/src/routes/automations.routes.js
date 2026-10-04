const { Router } = require("express");
const automationsController = require("../controllers/automations.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = Router();

// Automations are a doctor/admin-only surface, per the product requirement
// that patients never see a "2,300 apps" wall.
router.use(requireAuth, requireRole("DOCTOR", "ADMIN"));

router.get("/embed-token", asyncHandler(automationsController.getEmbedToken));
router.get("/flows", asyncHandler(automationsController.listFlows));
router.post("/flows", requireFetchHeader, asyncHandler(automationsController.handleFlowEvent));

module.exports = router;
