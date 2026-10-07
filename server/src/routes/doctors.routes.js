const { Router } = require("express");
const { z } = require("zod");
const doctorsController = require("../controllers/doctors.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { availabilitySchema } = require("../validators/appointment.schema");

const router = Router();
const doctorOnly = [requireAuth, requireRole("DOCTOR")];
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

router.get("/", asyncHandler(doctorsController.list));
router.get("/me/profile", ...doctorOnly, asyncHandler(doctorsController.getMyProfile));
router.put(
  "/me/availability",
  ...doctorOnly,
  requireFetchHeader,
  validate(z.object({ slots: z.array(availabilitySchema) })),
  asyncHandler(doctorsController.setAvailability)
);
const doctorSettingsSchema = z.object({
  bufferMins: z.coerce.number().int().min(0).max(60).optional(),
  locationUrl: z.union([z.string().url(), z.literal("")]).optional(),
  phone: z.union([z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number"), z.literal("")]).optional(),
  name: z.string().trim().min(1).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  qualifications: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(2000).optional(),
  fee: z.coerce.number().int().min(0).optional(),
  clinic: z.string().trim().max(200).optional(),
  clinicAddress: z.string().trim().max(500).optional(),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say", ""]).optional(),
});

router.patch(
  "/me/settings",
  ...doctorOnly,
  requireFetchHeader,
  validate(doctorSettingsSchema),
  asyncHandler(doctorsController.updateSettings)
);
router.patch(
  "/me/profile",
  ...doctorOnly,
  requireFetchHeader,
  validate(doctorSettingsSchema),
  asyncHandler(doctorsController.updateSettings)
);
router.post(
  "/me/leave",
  ...doctorOnly,
  requireFetchHeader,
  validate(z.object({ startDate: isoDate, endDate: isoDate.optional(), reason: z.string().max(200).optional() })),
  asyncHandler(doctorsController.addLeave)
);
router.delete("/me/leave/:timeOffId", ...doctorOnly, requireFetchHeader, asyncHandler(doctorsController.removeLeave));
router.get("/:id", asyncHandler(doctorsController.getById));
router.get("/:id/slots", asyncHandler(doctorsController.getSlots));

module.exports = router;
