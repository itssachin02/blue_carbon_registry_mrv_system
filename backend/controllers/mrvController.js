const path = require("path");
const mammoth = require("mammoth");
const XLSX = require("xlsx");
const MRVReport = require("../models/MRVReport");
const Project = require("../models/Project");
const uploadToIPFS = require("../utils/ipfs");
const { verifyMRVData, calculateConfidenceScore } = require("../utils/mrvVerification");
const { runVerificationPipeline } = require("../utils/verificationEngine");

const parseNumber = (value) => {
  if (value === undefined || value === null) return null;
  const cleaned = String(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return cleaned ? parseFloat(cleaned[0]) : null;
};

const parseTextForMRV = (text) => {
  const extracted = {};
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const addIfFound = (key, value) => {
    if (!extracted[key] && value) {
      extracted[key] = value.trim ? value.trim() : value;
    }
  };

  const patterns = [
    { key: "location", regex: /location\s*[:=]\s*(.+)/i },
    { key: "ecosystemType", regex: /ecosystem(?: type)?\s*[:=]\s*(.+)/i },
    { key: "area", regex: /area\s*(?:\(hectares\))?\s*[:=]\s*([\d,\.]+)/i },
    { key: "biomass", regex: /biomass\s*(?:\(tons\/?ha\))?\s*[:=]\s*([\d,\.]+)/i },
    { key: "reportedCarbon", regex: /reported carbon\s*(?:\(tons\))?\s*[:=]\s*([\d,\.]+)/i },
    { key: "reportedCarbon", regex: /carbon\s*(?:reported)?\s*[:=]\s*([\d,\.]+)/i },
  ];

  for (const line of lines) {
    patterns.forEach((pattern) => {
      if (!extracted[pattern.key]) {
        const match = line.match(pattern.regex);
        if (match) {
          if (pattern.key === "location" || pattern.key === "ecosystemType") {
            addIfFound(pattern.key, match[1]);
          } else {
            const parsed = parseNumber(match[1]);
            if (parsed !== null) {
              addIfFound(pattern.key, parsed);
            }
          }
        }
      }
    });
  }

  if (!extracted.ecosystemType) {
    const ecosystemMatch = String(text).match(/(mangrove|seagrass|saltmarsh|kelp|other)/i);
    if (ecosystemMatch) {
      extracted.ecosystemType = ecosystemMatch[1].toLowerCase();
    }
  }

  return extracted;
};

const parseSpreadsheetRows = (rows) => {
  const extracted = {};

  rows.forEach((row) => {
    Object.entries(row).forEach(([rawKey, rawValue]) => {
      const key = String(rawKey || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      const value = rawValue !== undefined && rawValue !== null ? String(rawValue).trim() : "";

      if (/location/.test(key) && value) {
        extracted.location = value;
      } else if (/(ecosystem|habitat|type)/.test(key) && value) {
        extracted.ecosystemType = value.toLowerCase();
      } else if (/area/.test(key) && value) {
        extracted.area = parseNumber(value);
      } else if (/biomass/.test(key) && value) {
        extracted.biomass = parseNumber(value);
      } else if (/(reportedcarbon|carbon)/.test(key) && value) {
        const parsed = parseNumber(value);
        if (parsed !== null) {
          extracted.reportedCarbon = parsed;
        }
      }
    });
  });

  return extracted;
};

const parseDocumentFile = async (file) => {
  const extension = path.extname(file.originalname).toLowerCase();

  try {
    if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return parseTextForMRV(result.value);
    }

    if (extension === ".xlsx" || extension === ".xls") {
      const workbook = XLSX.read(file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const parsed = parseSpreadsheetRows(rows);
      return Object.keys(parsed).length ? parsed : parseTextForMRV(XLSX.utils.sheet_to_csv(sheet));
    }

    const text = file.buffer.toString("utf8");
    return parseTextForMRV(text);
  } catch (error) {
    console.error("Document parse error:", error);
    return {};
  }
};

// Create MRV Report
exports.createReport = async (req, res) => {
  try {
    const {
      projectId,
      reportType,
      methodology,
      carbonSequestered,
      notes,
      ipfsHash,
      fileName,
    } = req.body;

    // Get project name
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const report = await MRVReport.create({
      projectId,
      projectName: project.name,
      reportType,
      methodology,
      carbonSequestered,
      notes,
      ipfsHash,
      fileName,
      user: req.user.id,
      status: "submitted",
    });

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All MRV Reports (with filters)
exports.getReports = async (req, res) => {
  try {
    const userId = req.query.userId;
    const projectId = req.query.projectId;
    const status = req.query.status;

    let query = {};
    if (userId) query.user = userId;
    if (projectId) query.projectId = projectId;
    if (status) query.status = status;

    const reports = await MRVReport.find(query)
      .populate("user", "name email")
      .populate("projectId", "name location")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Single Report
exports.getReport = async (req, res) => {
  try {
    const report = await MRVReport.findById(req.params.id)
      .populate("user", "name email")
      .populate("projectId", "name location");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update Report Status (for approval/rejection)
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const report = await MRVReport.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes,
        reviewedAt: new Date(),
      },
      { new: true }
    ).populate("user", "name email")
      .populate("projectId", "name location");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete Report
exports.deleteReport = async (req, res) => {
  try {
    const report = await MRVReport.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Verify MRV Data (AI-powered verification)
exports.verifyMRVData = async (req, res) => {
  try {
    const {
      location,
      ecosystemType,
      area,
      biomass,
      reportedCarbon,
      projectId,
    } = req.body;

    let documentData = {};
    if (req.file) {
      documentData = await parseDocumentFile(req.file);
    }

    const combinedLocation = location || documentData.location || "";
    const combinedEcosystemType = ecosystemType || documentData.ecosystemType || "mangrove";
    const combinedArea = area || documentData.area;
    const combinedBiomass = biomass || documentData.biomass;
    const combinedReportedCarbon = reportedCarbon !== undefined && reportedCarbon !== null
      ? reportedCarbon
      : documentData.reportedCarbon;

    if (!combinedLocation && !req.file) {
      return res.status(400).json({
        error: "Missing required field: location",
      });
    }

    if (!combinedArea || !combinedBiomass || combinedReportedCarbon === undefined || combinedReportedCarbon === null) {
      return res.status(400).json({
        error: "Missing required data. Provide area, biomass, and reported carbon or upload a document containing them.",
        parsedDocument: documentData,
      });
    }

    const verificationPayload = {
      location: combinedLocation,
      ecosystemType: combinedEcosystemType,
      area: parseFloat(combinedArea),
      biomass: parseFloat(combinedBiomass),
      reportedCarbon: parseFloat(combinedReportedCarbon),
    };

    const {
      verificationResult,
      modelVersion,
      inferenceSource,
      satelliteEvidence,
    } = await runVerificationPipeline(verificationPayload);

    const confidenceScore = verificationResult.confidenceScore !== undefined
      ? verificationResult.confidenceScore
      : calculateConfidenceScore(verificationResult);

    let report = null;
    try {
      const project = projectId ? await Project.findById(projectId) : null;
      const reportStatus = verificationResult.status === "Verified"
        ? "approved"
        : verificationResult.status === "Suspicious"
        ? "under-review"
        : "rejected";

      report = await MRVReport.create({
        projectId: projectId || null,
        projectName: project?.name || combinedLocation,
        reportType: "verification",
        status: reportStatus,
        methodology: "AI-MRV Verification Service v1.0",
        carbonSequestered: verificationResult.reportedCarbon,
        notes: verificationResult.reason,
        user: req.user?.id || null,
        verificationInputs: {
          ...verificationPayload,
          documentExtracted: documentData,
        },
        verificationEvidence: {
          modelVersion,
          inferenceSource,
          satelliteEvidence,
          documentEvidence: documentData,
          externalApiResponse: verificationResult.externalApiResponse || null,
        },
        auditTrail: [
          {
            eventType: "verification_run",
            detail: {
              verificationStatus: verificationResult.status,
              reason: verificationResult.reason,
              confidenceScore,
              modelVersion,
              inferenceSource,
              satelliteEvidence,
            },
            actor: req.user?.id || "system",
          },
        ],
      });
    } catch (dbError) {
      console.error("Error creating MRV report:", dbError);
    }

    res.json({
      ...verificationResult,
      confidenceScore,
      modelVersion,
      inferenceSource,
      satelliteEvidence,
      verificationInputs: {
        ...verificationPayload,
        documentExtracted: documentData,
      },
      report: report ? { _id: report._id, status: report.status } : null,
      timestamp: new Date().toISOString(),
      documentParsed: req.file ? documentData : undefined,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
