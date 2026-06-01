const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: String,
  title: String,
  description: String,
  location: String,
  area: Number,
  carbonCredits: Number,
  ecosystemType: {
    type: String,
    enum: ["mangrove", "seagrass", "saltmarsh", "kelp"],
    default: "mangrove"
  },
  status: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },
  latitude: Number,
  longitude: Number,
  proofIpfsHash: String,
  proofUrl: String,
  proofFileName: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  rejectionReason: String,
  approvedAt: Date,
  transactionHash: String,
  verifiedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);