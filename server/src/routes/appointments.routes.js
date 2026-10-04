const { Router } = require("express");
const appointmentsController = require("../controllers/appointments.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { createAppointmentSchema, updateAppointmentStatusSchema } = require("../validators/appointment.schema");

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(appointmentsController.listMine));
router.post(
  "/",
  requireRole("PATIENT"),
  requireFetchHeader,
  validate(createAppointmentSchema),
  asyncHandler(appointmentsController.create)
);
router.get("/:id", asyncHandler(appointmentsController.getById));
router.patch(
  "/:id/status",
  requireFetchHeader,
  validate(updateAppointmentStatusSchema),
  asyncHandler(appointmentsController.updateStatus)
);

module.exports = router;
