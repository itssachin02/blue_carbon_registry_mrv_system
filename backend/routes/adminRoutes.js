const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminMiddleware = require("../middleware/adminMiddleware");

// Get all pending projects for approval
router.get(
  "/projects/pending",
  adminMiddleware,
  adminController.getPendingProjects
);

// Get all projects with filter
router.get(
  "/projects",
  adminMiddleware,
  adminController.getAllProjects
);

// Get admin dashboard statistics
router.get(
  "/stats",
  adminMiddleware,
  adminController.getAdminStats
);

// Get admin processing analysis for project algorithms and blockchain coverage
router.get(
  "/analysis",
  adminMiddleware,
  adminController.getAdminAnalysis
);

// Export report data as CSV
router.get(
  "/reports/export",
  adminMiddleware,
  adminController.exportAdminReport
);

// Get developer details and their projects
router.get(
  "/developers/:userId",
  adminMiddleware,
  adminController.getDeveloperDetails
);

// Approve a project
router.put(
  "/projects/:projectId/approve",
  adminMiddleware,
  adminController.approveProject
);

// Reject a project
router.put(
  "/projects/:projectId/reject",
  adminMiddleware,
  adminController.rejectProject
);

// Admin user management
router.get("/users", adminMiddleware, adminController.getAllUsers);
router.put("/users/:userId/approve", adminMiddleware, adminController.approveUser);
router.put("/users/:userId/block", adminMiddleware, adminController.blockUser);
router.put("/users/:userId/unblock", adminMiddleware, adminController.unblockUser);

module.exports = router;
