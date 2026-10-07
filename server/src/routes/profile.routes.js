const { Router } = require("express");
const profileController = require("../controllers/profile.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { validate } = require("../middleware/validate");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");
const { requireRole } = require("../middleware/requireRole");
const { updatePatientProfileSchema, savedAddressSchema } = require("../validators/profile.schema");

const router = Router();

router.use(requireAuth);

// Patient profile endpoints
router.get("/me", asyncHandler(profileController.getProfile));
router.patch(
  "/me",
  requireRole("PATIENT"),
  requireFetchHeader,
  validate(updatePatientProfileSchema),
  asyncHandler(profileController.updateProfile)
);

// Saved addresses endpoints
router.get("/addresses", requireRole("PATIENT"), asyncHandler(profileController.listAddresses));
router.post(
  "/addresses",
  requireRole("PATIENT"),
  requireFetchHeader,
  validate(savedAddressSchema),
  asyncHandler(profileController.createAddress)
);
router.patch(
  "/addresses/:id",
  requireRole("PATIENT"),
  requireFetchHeader,
  validate(savedAddressSchema.partial()),
  asyncHandler(profileController.updateAddress)
);
router.delete(
  "/addresses/:id",
  requireRole("PATIENT"),
  requireFetchHeader,
  asyncHandler(profileController.deleteAddress)
);
router.patch(
  "/addresses/:id/default",
  requireRole("PATIENT"),
  requireFetchHeader,
  asyncHandler(profileController.setDefaultAddress)
);

module.exports = router;
