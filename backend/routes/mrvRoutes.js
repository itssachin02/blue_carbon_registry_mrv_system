const express = require("express");
const router = express.Router();

const {
  createReport,
  getReports,
  getReport,
  updateReportStatus,
  deleteReport,
  verifyMRVData,
} = require("../controllers/mrvController");

const {
  createMeasurement,
  generateReport,
  verifyReport,
  updateMeasurementStatus,
  getMeasurements,
  getMeasurement,
  getProjectMRVSummary,
} = require("../controllers/measurementController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ============================================
// 📊 MEASUREMENT ROUTES (Data Collection)
// ============================================
router.post("/measurement", authMiddleware, createMeasurement); // Create measurement with data
router.get("/measurement", getMeasurements); // Get all measurements
router.get("/measurement/:id", getMeasurement); // Get single measurement

// ============================================
// ✅ AI-POWERED VERIFICATION ROUTES
// ============================================
router.post("/verify-data", authMiddleware, upload.single("document"), verifyMRVData); // Verify carbon data using AI-MRV
router.put("/measurement/:id", authMiddleware, updateMeasurementStatus); // Update measurement status for reject/approve actions

// ============================================
// 📖 REPORT ROUTES (Data Reporting & Verification)
// ============================================
router.post("/measurement/:id/report", authMiddleware, generateReport); // Generate report from measurement
router.put("/measurement/:id/verify", authMiddleware, verifyReport); // Verify report

// ============================================
// 📈 SUMMARY ROUTES
// ============================================
router.get("/project/:projectId/summary", getProjectMRVSummary); // Get MRV summary for project

// ============================================
// 📝 LEGACY MRV REPORT ROUTES (kept for compatibility)
// ============================================
router.get("/", getReports);
router.get("/:id", getReport);
router.post("/", authMiddleware, createReport);
router.put("/:id", authMiddleware, updateReportStatus);
router.delete("/:id", authMiddleware, deleteReport);

module.exports = router;
