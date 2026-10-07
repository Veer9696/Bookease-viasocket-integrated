const { Router } = require("express");
const { z } = require("zod");
const automationsController = require("../controllers/automations.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");

const router = Router();

const flowEventSchema = z.object({
  action: z.enum(["initiated", "published", "updated", "paused", "deleted"]),
  id: z.string().min(1).max(64),
  title: z.string().max(300).nullish(),
  description: z.string().max(2000).nullish(),
  webhookurl: z.string().max(500).nullish(),
  payload: z.any().optional(),
  metadata: z.any().optional(),
  serviceIcons: z.array(z.string().max(2000)).max(20).nullish(),
});

// Automations are a doctor/admin-only surface, per the product requirement
// that patients never see a "2,300 apps" wall.
router.use(requireAuth, requireRole("DOCTOR", "ADMIN"));

router.get("/embed-token", asyncHandler(automationsController.getEmbedToken));
router.get("/flows", asyncHandler(automationsController.listFlows));
router.get(
  "/sample-payload",
  validate(
    z.object({
      event: z.enum([
        "appointment.created",
        "appointment.confirmed",
        "appointment.cancelled",
        "appointment.rejected",
        "appointment.completed",
        "appointment.reminder",
        "lab.booked",
        "lab.confirmed",
        "lab.cancelled",
        "lab.completed",
      ]),
    }),
    "query"
  ),
  asyncHandler(automationsController.samplePayload)
);
router.post("/flows", requireFetchHeader, validate(flowEventSchema), asyncHandler(automationsController.handleFlowEvent));

module.exports = router;
