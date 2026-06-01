import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  location: {
    country: string;
    region: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  ecosystemType: "mangrove" | "seagrass" | "saltmarsh" | "kelp" | "coral_reef";
  area: number; // in hectares
  carbonCredits: number;
  estimatedSequestration?: number; // tonnes CO2/year
  status: "draft" | "pending" | "under_review" | "verified" | "rejected";
  owner: mongoose.Types.ObjectId;
  verifier?: mongoose.Types.ObjectId;
  methodology?: string;
  startDate?: Date;
  endDate?: Date;
  blockchainHash?: string;
  blockchainTxId?: string;
  verifiedAt?: Date;
  documents: {
    name: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    location: {
      country: {
        type: String,
        required: [true, "Country is required"],
      },
      region: {
        type: String,
        required: [true, "Region is required"],
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    ecosystemType: {
      type: String,
      enum: ["mangrove", "seagrass", "saltmarsh", "kelp", "coral_reef"],
      required: [true, "Ecosystem type is required"],
    },
    area: {
      type: Number,
      required: [true, "Area is required"],
      min: [0.1, "Area must be at least 0.1 hectares"],
    },
    carbonCredits: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedSequestration: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "pending", "under_review", "verified", "rejected"],
      default: "draft",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    verifier: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    methodology: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    blockchainHash: {
      type: String,
    },
    blockchainTxId: {
      type: String,
    },
    verifiedAt: {
      type: Date,
    },
    documents: [
      {
        name: String,
        url: String,
        type: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
ProjectSchema.index({ owner: 1, status: 1 });
ProjectSchema.index({ "location.country": 1 });
ProjectSchema.index({ ecosystemType: 1 });

const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
