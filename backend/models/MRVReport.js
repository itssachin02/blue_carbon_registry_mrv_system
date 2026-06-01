const mongoose = require("mongoose");

const mrvReportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },
  projectName: String,
  reportType: {
    type: String,
    enum: ["baseline", "monitoring", "verification"],
    default: "monitoring",
  },
  status: {
    type: String,
    enum: ["submitted", "under-review", "approved", "rejected"],
    default: "submitted",
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  fileUrl: String,
  fileName: String,
  ipfsHash: String,
  carbonSequestered: Number,
  methodology: String,
  notes: String,
  verificationInputs: {
    location: String,
    ecosystemType: String,
    area: Number,
    biomass: Number,
    reportedCarbon: Number,
    documentExtracted: mongoose.Schema.Types.Mixed,
  },
  verificationEvidence: {
    modelVersion: String,
    inferenceSource: String,
    satelliteEvidence: mongoose.Schema.Types.Mixed,
    documentEvidence: mongoose.Schema.Types.Mixed,
    externalApiResponse: mongoose.Schema.Types.Mixed,
    ipfsProof: String,
  },
  auditTrail: [
    {
      eventType: String,
      detail: mongoose.Schema.Types.Mixed,
      actor: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
}, { timestamps: true });

module.exports = mongoose.model("MRVReport", mrvReportSchema);
