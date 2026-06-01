import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICarbonCredit extends Document {
  _id: mongoose.Types.ObjectId;
  creditId: string; // Unique credit identifier
  project: mongoose.Types.ObjectId;
  vintage: number; // Year the credits were generated
  quantity: number; // Number of credits (tonnes CO2)
  status: "active" | "retired" | "transferred" | "pending";
  owner: mongoose.Types.ObjectId;
  previousOwners: {
    owner: mongoose.Types.ObjectId;
    transferredAt: Date;
    quantity: number;
  }[];
  price?: number; // Price per credit in INR
  retiredFor?: string; // Purpose of retirement
  retiredAt?: Date;
  blockchainTokenId?: string;
  blockchainHash?: string;
  metadata: {
    ecosystemType: string;
    methodology: string;
    country: string;
    region: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CarbonCreditSchema = new Schema<ICarbonCredit>(
  {
    creditId: {
      type: String,
      required: true,
      unique: true,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project is required"],
    },
    vintage: {
      type: Number,
      required: [true, "Vintage year is required"],
      min: 2000,
      max: 2100,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "retired", "transferred", "pending"],
      default: "pending",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    previousOwners: [
      {
        owner: { type: Schema.Types.ObjectId, ref: "User" },
        transferredAt: Date,
        quantity: Number,
      },
    ],
    price: {
      type: Number,
      min: 0,
    },
    retiredFor: {
      type: String,
      maxlength: 500,
    },
    retiredAt: {
      type: Date,
    },
    blockchainTokenId: {
      type: String,
    },
    blockchainHash: {
      type: String,
    },
    metadata: {
      ecosystemType: String,
      methodology: String,
      country: String,
      region: String,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique credit ID before saving
CarbonCreditSchema.pre("save", async function (next) {
  if (!this.creditId) {
    const year = this.vintage || new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.creditId = `BC-${year}-${random}`;
  }
  next();
});

// Indexes
CarbonCreditSchema.index({ owner: 1, status: 1 });
CarbonCreditSchema.index({ project: 1 });

const CarbonCredit: Model<ICarbonCredit> =
  mongoose.models.CarbonCredit ||
  mongoose.model<ICarbonCredit>("CarbonCredit", CarbonCreditSchema);

export default CarbonCredit;
