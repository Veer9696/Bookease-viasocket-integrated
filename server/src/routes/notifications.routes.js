const { Router } = require("express");
const notificationsController = require("../controllers/notifications.controller");
const { asyncHandler } = require("../middleware/asyncHandler");
const { requireAuth, requireFetchHeader } = require("../middleware/requireAuth");

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(notificationsController.list));
router.post("/:id/read", requireFetchHeader, asyncHandler(notificationsController.markRead));
router.post("/read-all", requireFetchHeader, asyncHandler(notificationsController.markAllRead));

module.exports = router;
