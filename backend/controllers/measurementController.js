const Measurement = require("../models/Measurement");
const Project = require("../models/Project");
const MRVReport = require("../models/MRVReport");
const uploadToIPFS = require("../utils/ipfs");
const notifyController = require("./notificationController");
const { verifyProjectOnBlockchain } = require("../utils/blockchain");

// 📊 Calculate CO2 Absorption Formula
// CO₂ Absorbed = Area × Growth Rate × CO2 Absorption Rate × Conversion Factor
const calculateCO2Absorption = (area, growthRate, co2Rate, conversionFactor = 3.67) => {
  return (area * (growthRate / 100) * co2Rate * conversionFactor).toFixed(2);
};

// 💳 Generate Carbon Credits (1 credit = 1 tonne CO2)
const generateCarbonCredits = (co2Absorbed) => {
  return Math.floor(co2Absorbed);
};

// ✅ Step 1️⃣: Create Measurement (Data Collection)
exports.createMeasurement = async (req, res) => {
  try {
    const {
      projectId,
      measurementDate,
      areaMonitored,
      growthRate,
      co2AbsorptionRate,
      dataSource,
      sensorData,
      satelliteImagery,
      manualData,
    } = req.body;

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // 🧮 Calculate CO2 Absorption
    const calculatedCO2Absorbed = parseFloat(
      calculateCO2Absorption(areaMonitored, growthRate, co2AbsorptionRate)
    );

    // 💳 Generate Carbon Credits
    const carbonCreditsGenerated = generateCarbonCredits(calculatedCO2Absorbed);

    const measurement = await Measurement.create({
      projectId,
      projectName: project.name,
      measurementDate: new Date(measurementDate),
      areaMonitored,
      growthRate,
      co2AbsorptionRate,
      dataSource,
      sensorData,
      satelliteImagery,
      manualData,
      calculatedCO2Absorbed,
      carbonCreditsGenerated,
      status: "calculated",
      user: req.user.id,
    });

    // Create notification
    await notifyController.createNotification(
      req.user.id,
      "measurement_created",
      "Measurement Recorded",
      `Measurement recorded for "${project.name}": ${calculatedCO2Absorbed} tCO2e captured`,
      projectId
    );

    res.json({
      success: true,
      message: "Measurement recorded successfully",
      measurement: {
        ...measurement.toObject(),
        calculatedCO2Absorbed,
        carbonCreditsGenerated,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📖 Step 2️⃣: Generate Report (Data Reporting)
exports.generateReport = async (req, res) => {
  try {
    const { measurementId } = req.params;
    const { reportType = "monitoring", methodology, notes } = req.body;

    const measurement = await Measurement.findById(measurementId);
    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }

    // Create MRV Report
    const report = await MRVReport.create({
      projectId: measurement.projectId,
      projectName: measurement.projectName,
      reportType,
      methodology: methodology || "Standard MRV Methodology",
      carbonSequestered: measurement.calculatedCO2Absorbed,
      notes: notes || `Generated from measurement: ${measurement._id}`,
      user: req.user.id,
      ipfsHash: measurement.ipfsHash,
      status: "submitted",
    });

    // Update measurement status
    measurement.status = "verified";
    await measurement.save();

    // Create notification
    await notifyController.createNotification(
      req.user.id,
      "report_created",
      "Report Generated",
      `MRV Report generated for "${measurement.projectName}": ${measurement.calculatedCO2Absorbed} tCO2e`,
      measurement.projectId
    );

    res.json({
      success: true,
      message: "Report generated successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✔️ Step 3️⃣: Verify Report (Data Verification)
exports.verifyReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = true, verificationNotes = "" } = req.body;

    const report = await MRVReport.findById(id);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    const newStatus = approved ? "approved" : "rejected";
    report.status = newStatus;
    report.reviewedAt = new Date();
    report.notes = verificationNotes || report.notes;
    await report.save();

    // Update measurement
    const measurement = await Measurement.findOne({ projectId: report.projectId });
    if (measurement) {
      measurement.status = approved ? "verified" : "rejected";
      measurement.verifiedBy = req.user.id;
      measurement.verifiedAt = new Date();
      measurement.verificationNotes = verificationNotes;
      await measurement.save();
    }

    // Update project - Add credits if verified
    const project = await Project.findById(report.projectId);
    let blockchainTx = null;

    if (project && approved) {
      project.status = "verified";
      project.carbonCredits = (project.carbonCredits || 0) + (measurement?.carbonCreditsGenerated || 0);
      project.verifiedAt = new Date();

      if (!project.transactionHash) {
        blockchainTx = await verifyProjectOnBlockchain(
          project._id.toString(),
          project.carbonCredits || 0,
          measurement?.ipfsHash || project.ipfsHash || ""
        );

        if (blockchainTx?.transactionHash) {
          project.transactionHash = blockchainTx.transactionHash;
        }
      }

      await project.save();

      if (measurement && blockchainTx?.transactionHash) {
        measurement.blockchainTxHash = blockchainTx.transactionHash;
        await measurement.save();
      }

      // Create notification
      await notifyController.createNotification(
        project.user,
        "project_verified",
        "Project Verified ✅",
        `Your project "${project.name}" verified! ${measurement?.carbonCreditsGenerated || 0} carbon credits generated.`,
        project._id
      );
    }

    res.json({
      success: true,
      message: `Report ${newStatus} successfully`,
      report,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update measurement status (approve/reject)
exports.updateMeasurementStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const measurement = await Measurement.findByIdAndUpdate(
      req.params.id,
      {
        status,
        verificationNotes: notes,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
      },
      { new: true }
    ).populate("user", "name email").populate("projectId", "name location area");

    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }

    res.json(measurement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📊 Get All Measurements (with filters)
exports.getMeasurements = async (req, res) => {
  try {
    const { projectId, userId, status } = req.query;
    let query = {};

    if (projectId) query.projectId = projectId;
    if (userId) query.user = userId;
    if (status) query.status = status;

    const measurements = await Measurement.find(query)
      .populate("user", "name email")
      .populate("projectId", "name location area")
      .sort({ measurementDate: -1 });

    res.json(measurements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📊 Get Single Measurement
exports.getMeasurement = async (req, res) => {
  try {
    const measurement = await Measurement.findById(req.params.id)
      .populate("user", "name email")
      .populate("projectId", "name location area")
      .populate("verifiedBy", "name email");

    if (!measurement) {
      return res.status(404).json({ error: "Measurement not found" });
    }

    res.json(measurement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📈 Get Project MRV Summary
exports.getProjectMRVSummary = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get all measurements for project
    const measurements = await Measurement.find({ projectId }).sort({ measurementDate: -1 });

    // Get all reports for project
    const reports = await MRVReport.find({ projectId }).sort({ createdAt: -1 });

    // Calculate aggregates
    const totalCO2 = measurements.reduce((sum, m) => sum + (m.calculatedCO2Absorbed || 0), 0);
    const totalCredits = measurements.reduce((sum, m) => sum + (m.carbonCreditsGenerated || 0), 0);
    const averageGrowthRate = measurements.length > 0 
      ? (measurements.reduce((sum, m) => sum + m.growthRate, 0) / measurements.length).toFixed(2)
      : 0;

    res.json({
      project: {
        id: project._id,
        name: project.name,
        location: project.location,
        area: project.area,
        ecosystemType: project.ecosystemType,
      },
      summary: {
        totalMeasurements: measurements.length,
        totalReports: reports.length,
        totalCO2Absorbed: parseFloat(totalCO2.toFixed(2)),
        totalCarbonCreditsGenerated: totalCredits,
        averageGrowthRate: parseFloat(averageGrowthRate),
        verifiedCredits: project.carbonCredits || 0,
        projectStatus: project.status,
      },
      latestMeasurement: measurements[0] || null,
      measurements,
      reports,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
