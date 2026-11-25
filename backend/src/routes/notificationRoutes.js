const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");

router.get("/:walletAddress", notificationController.getUserNotifications);
router.post("/", notificationController.createNotification);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/:walletAddress/read-all", notificationController.markAllAsRead);

module.exports = router;
