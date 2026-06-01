const Project = require("../models/Project");
const Measurement = require("../models/Measurement");
const User = require("../models/user");
const notifyController = require("./notificationController");

const ecosystemAbsorptionRates = {
  mangrove: 250,
  seagrass: 190,
  saltmarsh: 180,
  kelp: 220,
};

const getExpectedCO2Credits = (project) => {
  const rate = ecosystemAbsorptionRates[project.ecosystemType] || 200;
  return (project.area || 0) * rate;
};

const getCreditDensity = (project) => {
  if (!project.area || project.carbonCredits == null) return 0;
  return project.carbonCredits / project.area;
};

const getReviewScore = (project) => {
  const expected = getExpectedCO2Credits(project);
  const efficiency = project.carbonCredits && expected ? project.carbonCredits / expected : 0;
  const efficiencyScore = Math.max(0, Math.min(30, 30 - Math.abs(1 - efficiency) * 30));
  const densityScore = Math.max(0, Math.min(30, 30 - Math.abs(getCreditDensity(project) - 200) / 200 * 30));
  const blockchainBonus = project.transactionHash ? 10 : 0;
  const rawScore = 40 + efficiencyScore + densityScore + blockchainBonus;
  return Math.min(100, Math.max(0, Math.round(rawScore)));
};

const evaluateProject = (project, allProjects) => {
  const expectedCredits = getExpectedCO2Credits(project);
  const creditDensity = getCreditDensity(project);
  const efficiencyRatio = expectedCredits ? project.carbonCredits / expectedCredits : 0;

  const validDensities = allProjects
    .filter((p) => p.area > 0 && p.carbonCredits != null)
    .map(getCreditDensity);
  const avgDensity = validDensities.length
    ? validDensities.reduce((sum, value) => sum + value, 0) / validDensities.length
    : 0;
  const variance = validDensities.length
    ? validDensities.reduce((sum, value) => sum + Math.pow(value - avgDensity, 2), 0) / validDensities.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev ? (creditDensity - avgDensity) / stdDev : 0;
  const isOutlier = Math.abs(zScore) > 1.5;
  const score = getReviewScore(project);

  const flags = [];
  if (!project.area || project.carbonCredits == null) {
    flags.push("Missing critical area or carbon credit data");
  }
  if (efficiencyRatio < 0.75) {
    flags.push("Credits are too low for the reported area and ecosystem");
  }
  if (efficiencyRatio > 1.3) {
    flags.push("Credits are unusually high for the reported ecosystem absorption");
  }
  if (isOutlier) {
    flags.push("Credit density is an outlier compared to historical projects");
  }
  if (!project.ecosystemType) {
    flags.push("Ecosystem type is missing or invalid");
  }

  let recommendation = "Review manually";
  if (score >= 70 && flags.length === 0) {
    recommendation = "Approve";
  } else if (score < 50 || flags.length >= 2) {
    recommendation = "Requires deeper verification";
  }

  return {
    score,
    recommendation,
    creditDensity: Number(creditDensity.toFixed(2)),
    expectedCredits: Number(expectedCredits.toFixed(0)),
    efficiencyRatio: Number(efficiencyRatio.toFixed(2)),
    isOutlier,
    flags,
    algorithms: [
      "Credit Efficiency Analysis",
      "Outlier Detection",
      "Blockchain Coverage Check",
    ],
  };
};

const buildProjectAnalysis = (projects) => {
  const validProjects = projects.filter((project) => project.area > 0 && project.carbonCredits != null);
  const densities = validProjects.map(getCreditDensity);
  const averageDensity = densities.length
    ? densities.reduce((sum, value) => sum + value, 0) / densities.length
    : 0;
  const variance = densities.length
    ? densities.reduce((sum, value) => sum + Math.pow(value - averageDensity, 2), 0) / densities.length
    : 0;
  const stdDev = Math.sqrt(variance);
  const anomalies = validProjects.filter((project) => {
    const density = getCreditDensity(project);
    const zScore = stdDev ? (density - averageDensity) / stdDev : 0;
    return Math.abs(zScore) > 1.5 || density === 0 || getCreditDensity(project) > averageDensity * 2 || getCreditDensity(project) < averageDensity * 0.5;
  });

  const reviewedProjects = projects.map((project) => {
    const expectedCredits = getExpectedCO2Credits(project);
    const creditDensity = getCreditDensity(project);
    const efficiencyRatio = expectedCredits ? project.carbonCredits / expectedCredits : 0;
    const reviewScore = getReviewScore(project);

    return {
      id: project._id,
      name: project.name || "Unnamed project",
      approvalStatus: project.approvalStatus,
      blockchainVerified: Boolean(project.transactionHash),
      creditDensity: Number(creditDensity.toFixed(2)),
      expectedCredits: Number(expectedCredits.toFixed(0)),
      efficiencyRatio: Number(efficiencyRatio.toFixed(2)),
      reviewScore,
      reason:
        reviewScore < 50
          ? "Needs manual review due to low efficiency or missing blockchain verification"
          : reviewScore < 70
          ? "Moderate review required"
          : "Strong project consistency",
    };
  });

  const riskProjects = reviewedProjects
    .filter((item) => item.reviewScore < 70)
    .sort((a, b) => a.reviewScore - b.reviewScore)
    .slice(0, 3);

  const blockchainCount = projects.filter((project) => project.transactionHash).length;

  return {
    summary: {
      totalProjects: projects.length,
      totalMeasurements: 0,
      projectsOnBlockchain: blockchainCount,
      blockchainCoveragePercent: projects.length
        ? Math.round((blockchainCount / projects.length) * 100)
        : 0,
      averageCreditDensity: Number(averageDensity.toFixed(2)),
      creditDensityStdDev: Number(stdDev.toFixed(2)),
      anomalyCount: anomalies.length,
    },
    riskProjects,
    algorithms: [
      {
        name: "Credit Efficiency Analysis",
        description:
          "A rule-based real-world model compares credits per hectare against expected absorption rates for each ecosystem type.",
      },
      {
        name: "Outlier Detection",
        description:
          "A statistical algorithm flags unusual credit density values, finding projects with abnormal CO₂ per hectare metrics.",
      },
      {
        name: "Blockchain Verification Analysis",
        description:
          "Checks whether the project record is anchored on blockchain, ensuring tamper-resistant traceability.",
      },
    ],
  };
};

// Get all pending projects for admin approval
exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ approvalStatus: "pending" })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    const allProjects = await Project.find().lean();
    const projectsWithReview = projects.map((project) => {
      const projectObj = project.toObject();
      projectObj.reviewData = evaluateProject(projectObj, allProjects);
      return projectObj;
    });

    res.json({ projects: projectsWithReview });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all projects with approval history
exports.getAllProjects = async (req, res) => {
  try {
    const { status = "all" } = req.query;

    let query = {};
    if (status !== "all") {
      query.approvalStatus = status; // pending, approved, rejected
    }

    const projects = await Project.find(query)
      .populate("user", "name email location")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    // Get total count of all projects
    const totalProjects = await Project.countDocuments();

    res.json({ projects, totalProjects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve a project
exports.approveProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { comments } = req.body;
    const adminId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const allProjects = await Project.find().lean();
    const reviewData = evaluateProject(project.toObject(), allProjects);

    // Update project
    project.approvalStatus = "approved";
    project.status = "verified"; // keep user dashboard status in sync
    project.approvedBy = adminId;
    project.approvedAt = new Date();

    // Update pending measurement credits for the project (pending -> verified)
    const pendingMeasurements = await Measurement.find({
      projectId: project._id,
      status: { $in: ["calculated", "submitted", "calculating"] },
    });

    let pendingCreditTotal = 0;
    for (const measurement of pendingMeasurements) {
      measurement.status = "verified";
      measurement.verifiedBy = adminId;
      measurement.verifiedAt = new Date();
      await measurement.save();
      pendingCreditTotal += measurement.carbonCreditsGenerated || 0;
    }

    project.carbonCredits = (project.carbonCredits || 0) + pendingCreditTotal;
    await project.save();

    // Populate for response
    await project.populate("user", "name email");
    await project.populate("approvedBy", "name email");

    // Create notification for project owner
    await notifyController.createNotification(
      project.user._id,
      "project_approved",
      "Project Approved ✅",
      `Your project "${project.name}" has been approved by admin.${
        comments ? ` Comment: ${comments}` : ""
      }`,
      project._id
    );

    res.json({
      success: true,
      message: "Project approved successfully",
      project,
      reviewData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject a project
exports.rejectProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Update project
    project.approvalStatus = "rejected";
    project.status = "rejected"; // sync with dashboard status
    project.approvedBy = adminId;
    project.rejectionReason = reason;
    project.approvedAt = new Date();
    await project.save();

    // Populate for response
    await project.populate("user", "name email");
    await project.populate("approvedBy", "name email");

    // Create notification for project owner
    await notifyController.createNotification(
      project.user._id,
      "project_rejected",
      "Project Rejected ❌",
      `Your project "${project.name}" was rejected. Reason: ${reason}`,
      project._id
    );

    res.json({
      success: true,
      message: "Project rejected",
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard statistics
exports.getAdminStats = async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const pendingProjects = await Project.countDocuments({
      approvalStatus: "pending",
    });
    const approvedProjects = await Project.countDocuments({
      approvalStatus: "approved",
    });
    const rejectedProjects = await Project.countDocuments({
      approvalStatus: "rejected",
    });
    const totalDevelopers = await User.countDocuments({
      role: "developer",
    });
    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    res.json({
      stats: {
        totalProjects,
        pendingProjects,
        approvedProjects,
        rejectedProjects,
        totalDevelopers,
        totalAdmins,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get admin processing analysis for algorithm and blockchain coverage
exports.getAdminAnalysis = async (req, res) => {
  try {
    const projects = await Project.find().lean();
    const measurements = await Measurement.find().lean();
    const analysis = buildProjectAnalysis(projects);
    analysis.summary.totalMeasurements = measurements.length;
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Export admin report as CSV
exports.exportAdminReport = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("user", "name email")
      .lean();
    const users = await User.find().lean();

    const totalProjects = projects.length;
    const approvedProjects = projects.filter((p) => p.approvalStatus === "approved").length;
    const pendingProjects = projects.filter((p) => p.approvalStatus === "pending").length;
    const rejectedProjects = projects.filter((p) => p.approvalStatus === "rejected").length;
    const totalUsers = users.length;
    const totalCO2 = projects.reduce((sum, p) => sum + (p.carbonCapture || 0), 0);
    const totalCredits = projects.reduce((sum, p) => sum + (p.carbonCredits || 0), 0);

    const lines = [];
    lines.push("Report Type,BlueCarbon Admin Report");
    lines.push(`Generated On,${new Date().toISOString()}`);
    lines.push(`Total Projects,${totalProjects}`);
    lines.push(`Approved Projects,${approvedProjects}`);
    lines.push(`Pending Projects,${pendingProjects}`);
    lines.push(`Rejected Projects,${rejectedProjects}`);
    lines.push(`Total Users,${totalUsers}`);
    lines.push(`Total CO2 Captured,${totalCO2}`);
    lines.push(`Total Credits,${totalCredits}`);
    lines.push("");
    lines.push("Project ID,Project Name,Owner Name,Owner Email,Approval Status,Carbon Credits,Carbon Capture,Area,Ecosystem Type,Created At");

    projects.forEach((project) => {
      const ownerName = project.user?.name || "Unknown";
      const ownerEmail = project.user?.email || "Unknown";
      const createdAt = project.createdAt ? new Date(project.createdAt).toISOString() : "";
      lines.push(
        `${project._id},"${(project.name || "").replace(/"/g, '""')}","${ownerName.replace(/"/g, '""')}","${ownerEmail.replace(/"/g, '""')}",${project.approvalStatus || "unknown"},${project.carbonCredits || 0},${project.carbonCapture || 0},${project.area || 0},${project.ecosystemType || "unknown"},${createdAt}`
      );
    });

    const csv = lines.join("\r\n");
    const fileName = `report-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csv);
  } catch (error) {
    console.error("Error exporting admin report:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all users for admin
exports.getAllUsers = async (req, res) => {
  try {
    console.log("📥 getAllUsers called by admin:", req.adminUser?.email);
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    console.log("📊 Total users in DB:", users.length);
    console.log("👥 Users data:", users);
    res.json({ users });
  } catch (error) {
    console.error("❌ Error in getAllUsers:", error);
    res.status(500).json({ error: error.message });
  }
};

// Approve user
exports.approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isApproved = true;
    user.isBlocked = false;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Block user
exports.blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBlocked = true;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unblock user
exports.unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.isBlocked = false;
    await user.save();

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get developer details with their projects
exports.getDeveloperDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const developer = await User.findById(userId);
    if (!developer) {
      return res.status(404).json({ error: "Developer not found" });
    }

    const projects = await Project.find({ user: userId }).sort({
      createdAt: -1,
    });

    res.json({
      developer,
      projects,
      stats: {
        totalProjects: projects.length,
        approvedProjects: projects.filter((p) => p.approvalStatus === "approved")
          .length,
        pendingProjects: projects.filter((p) => p.approvalStatus === "pending")
          .length,
        rejectedProjects: projects.filter((p) => p.approvalStatus === "rejected")
          .length,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
