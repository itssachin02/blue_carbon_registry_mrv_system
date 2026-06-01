const express = require("express");
const router = express.Router();

const { 
  createProject, 
  getProjects, 
  getProject,
  updateProject,
  deleteProject,
  uploadFile,
  uploadProjectProof,
  bulkUploadDataset,
  processMRVDataset,
  verifyProject 
} = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// Get all projects
router.get("/", getProjects);

// Get single project
router.get("/:id", getProject);

// Create project (requires auth)
router.post("/", authMiddleware, upload.single("file"), createProject);

// Update project (requires auth)
router.put("/:id", authMiddleware, updateProject);

// Delete project (requires auth)
router.delete("/:id", authMiddleware, deleteProject);

// Upload proof file to Pinata and attach to project
router.post(
  "/:id/upload-proof",
  authMiddleware,
  upload.single("file"),
  uploadProjectProof
);

// Upload file to IPFS (requires auth)
router.post("/upload", authMiddleware, upload.single("file"), uploadFile);

// Bulk dataset upload and cleaning (requires auth)
router.post(
  "/bulk-upload",
  authMiddleware,
  upload.single("file"),
  bulkUploadDataset
);

// Process dataset with MRV calculations (requires auth)
router.post(
  "/process-mrv",
  authMiddleware,
  upload.single("file"),
  processMRVDataset
);

// Verify project on blockchain (requires auth)
router.put("/:projectId/verify", authMiddleware, verifyProject);

module.exports = router;