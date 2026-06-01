import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMRVReport extends Document {
  _id: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  reportType: "baseline" | "monitoring" | "verification" | "annual";
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  methodology: string;
  carbonSequestered: number; // tonnes CO2
  emissionsReduced: number; // tonnes CO2
  dataSource: string;
  accuracy: number; // percentage
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  submittedBy: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  documents: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  blockchainHash?: string;
  blockchainTxId?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MRVReportSchema = new Schema<IMRVReport>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    reportType: {
      type: String,
      enum: ["baseline", "monitoring", "verification", "annual"],
      required: [true, "Report type is required"],
    },
    reportingPeriod: {
      startDate: {
        type: Date,
        required: [true, "Start date is required"],
      },
      endDate: {
        type: Date,
        required: [true, "End date is required"],
      },
    },
    methodology: {
      type: String,
      required: [true, "Methodology is required"],
    },
    carbonSequestered: {
      type: Number,
      required: [true, "Carbon sequestered is required"],
      min: 0,
    },
    emissionsReduced: {
      type: Number,
      default: 0,
      min: 0,
    },
    dataSource: {
      type: String,
      required: [true, "Data source is required"],
    },
    accuracy: {
      type: Number,
      required: [true, "Accuracy is required"],
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "approved", "rejected"],
      default: "draft",
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewNotes: {
      type: String,
      maxlength: 1000,
    },
    documents: [
      {
        name: String,
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    blockchainHash: {
      type: String,
    },
    blockchainTxId: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MRVReportSchema.index({ project: 1, status: 1 });
MRVReportSchema.index({ submittedBy: 1 });
MRVReportSchema.index({ reportType: 1 });

const MRVReport: Model<IMRVReport> =
  mongoose.models.MRVReport ||
  mongoose.model<IMRVReport>("MRVReport", MRVReportSchema);

export default MRVReport;
