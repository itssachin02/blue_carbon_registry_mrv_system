const crypto = require("crypto");

/**
 * Generate a unique Ethereum-like wallet address
 * Format: 0x + 40 random hex characters
 * Each user gets a unique address
 */
function generateWalletAddress() {
  // Generate 20 bytes of random data (40 hex characters)
  const randomBytes = crypto.randomBytes(20);
  // Convert to hex and prepend 0x
  return "0x" + randomBytes.toString("hex");
}

/**
 * Verify if a string is a valid Ethereum address format
 */
function isValidWalletAddress(address) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

module.exports = {
  generateWalletAddress,
  isValidWalletAddress,
};
