const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectName: String,
    measurementDate: {
      type: Date,
      required: true,
    },
    // 🌍 Key Measurement Parameters
    areaMonitored: {
      type: Number,
      required: true, // in hectares
    },
    growthRate: {
      type: Number,
      required: true, // percentage per year
    },
    co2AbsorptionRate: {
      type: Number,
      required: true, // tonnes CO2/hectare/year
    },
    // 📊 Data Sources
    dataSource: {
      type: String,
      enum: ["sensor", "satellite", "manual", "combined"],
      required: true,
    },
    sensorData: {
      temperature: Number,
      humidity: Number,
      soilMoisture: Number,
      biomass: Number, // in tonnes
    },
    satelliteImagery: {
      source: String,
      resolution: String,
      captureDate: Date,
      url: String,
    },
    manualData: {
      notes: String,
      fieldTeam: String,
      verificationPhotos: [String],
    },
    // 💨 CO2 Calculations
    calculatedCO2Absorbed: {
      type: Number,
      required: true, // tonnes CO2e
    },
    conversionFactor: {
      type: Number,
      default: 3.67, // standard CO2 conversion
    },
    // 🔗 Carbon Credits
    carbonCreditsGenerated: {
      type: Number,
      default: 0, // 1 credit = 1 tonne CO2
    },
    // Status & Verification
    status: {
      type: String,
      enum: ["submitted", "calculating", "calculated", "verified", "rejected"],
      default: "submitted",
    },
    verificationNotes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    // Blockchain
    blockchainHash: String,
    blockchainTxHash: String,
    // Metadata
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    ipfsHash: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Measurement", measurementSchema);
