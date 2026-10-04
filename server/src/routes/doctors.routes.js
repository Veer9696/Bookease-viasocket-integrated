const { Router } = require("express");
const doctorsController = require("../controllers/doctors.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { availabilitySchema } = require("../validators/appointment.schema");
const { z } = require("zod");

const router = Router();

router.get("/", asyncHandler(doctorsController.list));
router.get("/me/profile", requireAuth, requireRole("DOCTOR"), asyncHandler(doctorsController.getMyProfile));
router.put(
  "/me/availability",
  requireAuth,
  requireRole("DOCTOR"),
  requireFetchHeader,
  validate(z.object({ slots: z.array(availabilitySchema) })),
  asyncHandler(doctorsController.setAvailability)
);
router.post(
  "/me/time-off",
  requireAuth,
  requireRole("DOCTOR"),
  requireFetchHeader,
  validate(z.object({ date: z.coerce.date(), startTime: z.string().optional(), endTime: z.string().optional(), reason: z.string().optional() })),
  asyncHandler(doctorsController.addTimeOff)
);
router.get("/:id", asyncHandler(doctorsController.getById));
router.get("/:id/slots", asyncHandler(doctorsController.getSlots));

module.exports = router;
