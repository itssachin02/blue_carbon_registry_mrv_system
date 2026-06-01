const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

// Get all notifications
router.get("/", authMiddleware, notificationController.getNotifications);

// Get unread count
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);

// Mark specific notification as read
router.put("/:notificationId/read", authMiddleware, notificationController.markAsRead);

// Delete notification
router.delete("/:notificationId", authMiddleware, notificationController.deleteNotification);

// Mark all as read
router.put("/mark-all/read", authMiddleware, notificationController.markAllAsRead);

// Demo: Add test notifications (for development)
router.post("/demo/create-test", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const testNotifications = [
      {
        userId,
        type: "project_created",
        title: "Project Created ✨",
        message: "Your Mangrove Forest Initiative project has been created successfully.",
      },
      {
        userId,
        type: "verification_request",
        title: "Verification Request 🔍",
        message: "Your project is pending verification. Admin will review within 48 hours.",
      },
      {
        userId,
        type: "transaction_confirmed",
        title: "Transaction Confirmed ✅",
        message: "Your blockchain transaction #0x1a2b3c has been confirmed.",
      },
      {
        userId,
        type: "mrv_report_approved",
        title: "MRV Report Approved 📋",
        message: "Your MRV report for Q1 2026 has been approved.",
      },
      {
        userId,
        type: "credit_transfer",
        title: "Credits Received 💚",
        message: "You received 500 carbon credits from another project.",
      },
    ];

    const created = await Notification.insertMany(testNotifications);
    res.json({ message: "Test notifications created", count: created.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
