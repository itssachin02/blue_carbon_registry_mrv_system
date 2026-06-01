const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "verification_request",
        "transaction_confirmed",
        "mrv_report_approved",
        "project_created",
        "credit_transfer",
        "trading_offer",
        "system_alert",
      ],
      required: true,
    },
    title: String,
    message: String,
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    relatedId: String, // For transaction hash, etc.
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
