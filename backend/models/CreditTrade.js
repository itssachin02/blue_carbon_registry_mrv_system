const mongoose = require("mongoose");

const creditTradeSchema = new mongoose.Schema(
  {
    tradeId: { type: String, unique: true, required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creditAmount: { type: Number, required: true },
    pricePerCredit: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    listingDate: { type: Date, default: Date.now },
    completionDate: { type: Date },
    transactionHash: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("CreditTrade", creditTradeSchema);
