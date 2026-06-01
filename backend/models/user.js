const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ["developer", "admin"],
    default: "developer"
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  walletAddress: String,
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);