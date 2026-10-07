const { Router } = require("express");

const router = Router();

router.use("/auth", require("./auth.routes"));
router.use("/doctors", require("./doctors.routes"));
router.use("/appointments", require("./appointments.routes"));
router.use("/lab-bookings", require("./labBookings.routes"));
router.use("/notifications", require("./notifications.routes"));
router.use("/automations", require("./automations.routes"));
router.use("/analytics", require("./analytics.routes"));
router.use("/profile", require("./profile.routes"));

module.exports = router;
