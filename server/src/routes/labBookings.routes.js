const { Router } = require("express");
const labBookingsController = require("../controllers/labBookings.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { createLabBookingSchema, updateLabBookingStatusSchema } = require("../validators/labBooking.schema");

const router = Router();

router.get("/tests", asyncHandler(labBookingsController.listTests));

router.use(requireAuth, requireRole("PATIENT"));

router.get("/", asyncHandler(labBookingsController.listMine));
router.post("/", requireFetchHeader, validate(createLabBookingSchema), asyncHandler(labBookingsController.create));
router.get("/:id", asyncHandler(labBookingsController.getById));
router.patch(
  "/:id/status",
  requireFetchHeader,
  validate(updateLabBookingStatusSchema),
  asyncHandler(labBookingsController.updateStatus)
);

module.exports = router;
