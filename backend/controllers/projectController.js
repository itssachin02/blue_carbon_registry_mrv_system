const Project = require("../models/Project");
const uploadToIPFS = require("../utils/ipfs");
const { uploadJSONToPinata } = require("../utils/pinata");
const { storeHash } = require("../blockchain");
const { verifyProjectOnBlockchain } = require("../utils/blockchain");
const { parseDatasetFile, cleanDataset, buildUploadSummary } = require("../utils/datasetCleaner");
const notifyController = require("./notificationController");
const { runMRVProcessor } = require("../utils/pythonProcessor");

// Create Project
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      area,
      carbonCredits,
      ecosystemType,
      latitude,
      longitude,
    } = req.body;

    const newProject = await Project.create({
      name,
      description,
      location,
      area: area ? Number(area) : undefined,
      carbonCredits: carbonCredits ? Number(carbonCredits) : undefined,
      ecosystemType,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      user: req.user.id,
      status: "pending",
    });

    let proofUploadResult = null;

    if (req.file) {
      try {
        const hash = await uploadToIPFS(req.file);
        const url = `https://gateway.pinata.cloud/ipfs/${hash}`;

        newProject.proofIpfsHash = hash;
        newProject.proofUrl = url;
        newProject.proofFileName = req.file.originalname;
        await newProject.save();

        try {
          const txHash = await storeHash("Blue Carbon Project Proof", hash);
          newProject.transactionHash = txHash;
          await newProject.save();
          proofUploadResult = { ipfsHash: hash, proofUrl: url, transactionHash: txHash };
        } catch (blockchainError) {
          console.error("Blockchain proof storage failed:", blockchainError);
          proofUploadResult = { ipfsHash: hash, proofUrl: url, transactionHash: null };
        }
      } catch (uploadError) {
        console.error("Proof upload failed during project creation:", uploadError);
        proofUploadResult = { error: uploadError.message || "Pinata upload failed" };
      }
    }

    // Create notification
    await notifyController.createNotification(
      req.user.id,
      "project_created",
      "Project Created",
      `Your project "${name}" in ${location} has been created successfully.`,
      newProject._id
    );

    res.json({
      project: newProject,
      proofUploadResult,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Projects (with user filter if needed)
exports.getProjects = async (req, res) => {
  try {
    const userId = req.query.userId;
    const query = userId ? { user: userId } : {};
    
    const projects = await Project.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("user", "name email");
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("user", "name email");
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload proof file and attach Pinata metadata to project
exports.uploadProjectProof = async (req, res) => {
  try {
    const projectId = req.params.id;
    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Pin the file to Pinata
    const hash = await uploadToIPFS(req.file);
    const url = `https://gateway.pinata.cloud/ipfs/${hash}`;

    project.proofIpfsHash = hash;
    project.proofUrl = url;
    project.proofFileName = req.file.originalname;
    await project.save();

    // Optionally store the hash on blockchain for additional immutability
    const txHash = await storeHash("Blue Carbon Project Proof", hash);

    res.json({
      message: "Proof file uploaded to Pinata and linked to project",
      ipfsHash: hash,
      proofUrl: url,
      transactionHash: txHash,
    });
  } catch (error) {
    console.error("Project proof upload error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Upload File to IPFS
exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ Step 1: Upload to IPFS
    const hash = await uploadToIPFS(req.file);

    // ✅ Step 2: Store on Blockchain
    const txHash = await storeHash("Blue Carbon Project", hash);

    // ✅ Response
    res.json({
      message: "File uploaded to IPFS & stored on Blockchain",
      ipfsHash: hash,
      transactionHash: txHash,
      url: `https://gateway.pinata.cloud/ipfs/${hash}`,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Bulk dataset upload, cleaning, and secure storage
exports.bulkUploadDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No dataset file uploaded" });
    }

    const parsedRows = await parseDatasetFile(req.file.buffer, req.file.originalname);

    if (!parsedRows || !parsedRows.length) {
      return res.status(400).json({ error: "Unable to parse dataset file" });
    }

    const cleanedRows = cleanDataset(parsedRows);
    if (!cleanedRows.length) {
      return res.status(400).json({ error: "No valid records found after cleaning" });
    }

    const summary = buildUploadSummary(parsedRows, cleanedRows);
    const payload = {
      datasetName: req.file.originalname,
      cleanedRecords: cleanedRows,
      summary,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString(),
    };

    const pinataResult = await uploadJSONToPinata(payload, req.file.originalname);
    const txHash = await storeHash(req.file.originalname, pinataResult.ipfsHash);

    res.json({
      message: "Dataset cleaned, pinned to IPFS, and recorded on blockchain",
      summary,
      cleanedCount: cleanedRows.length,
      ipfsHash: pinataResult.ipfsHash,
      transactionHash: txHash,
      url: `https://gateway.pinata.cloud/ipfs/${pinataResult.ipfsHash}`,
    });
  } catch (error) {
    console.error("Bulk dataset upload error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Process dataset with MRV calculations using Python
exports.processMRVDataset = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No dataset file uploaded" });
    }

    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: "Project ID is required" });
    }

    // Get project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Step 1: Parse and clean dataset
    const parsedRows = await parseDatasetFile(req.file.buffer, req.file.originalname);

    if (!parsedRows || !parsedRows.length) {
      return res.status(400).json({ error: "Unable to parse dataset file" });
    }

    const cleanedRows = cleanDataset(parsedRows);
    if (!cleanedRows.length) {
      return res.status(400).json({ error: "No valid records found after cleaning" });
    }

    const summary = buildUploadSummary(parsedRows, cleanedRows);

    const rowsForProcessing = cleanedRows.map((cleanedRow) => {
      const rawRow = { ...(cleanedRow.raw || {}) };

      if (!rawRow.site_id && cleanedRow.name) {
        rawRow.site_id = cleanedRow.name;
      }
      if (!rawRow.habitat_type && cleanedRow.ecosystemType) {
        rawRow.habitat_type = cleanedRow.ecosystemType;
      }
      if (!rawRow.area_hectares && cleanedRow.area) {
        rawRow.area_hectares = cleanedRow.area;
      }
      if (!rawRow.carbon_stock_tonnes_per_hectare && cleanedRow.carbonCredits) {
        rawRow.carbon_stock_tonnes_per_hectare = cleanedRow.carbonCredits;
      }
      if (!rawRow.measurement_date) {
        rawRow.measurement_date = new Date().toISOString().split("T")[0];
      }
      if (rawRow.uncertainty_percent === undefined || rawRow.uncertainty_percent === null) {
        rawRow.uncertainty_percent = 10;
      }

      return rawRow;
    });

    // Step 2: Call Python MRV processor
    let mrvResult;
    try {
      mrvResult = await runMRVProcessor(projectId, rowsForProcessing);
    } catch (pythonError) {
      console.error("MRV Processing error:", pythonError);
      return res.status(500).json({ 
        error: "MRV processing failed",
        details: pythonError.message 
      });
    }

    // Step 3: Upload processed data to IPFS
    const processedPayload = {
      projectId,
      projectName: project.name,
      datasetName: req.file.originalname,
      originalRecords: parsedRows.length,
      cleanedRecords: cleanedRows.length,
      mrvResults: mrvResult,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString(),
    };

    const pinataResult = await uploadJSONToPinata(
      processedPayload,
      `MRV_${projectId}_${Date.now()}`
    );

    // Step 4: Store hash on blockchain
    const txHash = await storeHash(
      `MRV Report - ${project.name}`,
      pinataResult.ipfsHash
    );

    // Step 5: Create notification
    await notifyController.createNotification(
      req.user.id,
      "mrv_processed",
      "MRV Processing Complete",
      `Dataset for project "${project.name}" has been processed. Total sequestration: ${mrvResult.sequestration_total.toFixed(2)} tonnes CO2.`,
      projectId
    );

    // Return comprehensive result
    res.json({
      success: true,
      message: "Dataset processed with MRV calculations",
      projectId,
      projectName: project.name,
      datasetName: req.file.originalname,
      processing: {
        totalRecords: parsedRows.length,
        cleanedRecords: cleanedRows.length,
        recordsProcessed: mrvResult.validated_rows,
      },
      validation: summary.validation,
      mrvResults: {
        sequestrationTotal: mrvResult.sequestration_total,
        sequestrationUnit: "tonnes CO2",
        uncertaintyRange: mrvResult.uncertainty_range,
        habitatBreakdown: mrvResult.sequestration_calculation.habitat_breakdown,
      },
      ipfsHash: pinataResult.ipfsHash,
      transactionHash: txHash,
      ipfsUrl: `https://gateway.pinata.cloud/ipfs/${pinataResult.ipfsHash}`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("MRV dataset processing error:", error);
    res.status(500).json({ 
      error: "MRV dataset processing failed",
      details: error.message 
    });
  }
};

// Verify Project on Blockchain
exports.verifyProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { ipfsHash } = req.body;

    // Get project details
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Verify on blockchain
    const blockchainTx = await verifyProjectOnBlockchain(
      projectId,
      project.carbonCredits,
      ipfsHash
    );

    // Update project status
    project.status = "verified";
    project.verifiedAt = new Date();
    project.transactionHash = blockchainTx.transactionHash;
    await project.save();

    res.json({
      success: true,
      message: "Project verified on blockchain",
      project,
      blockchainTx,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
