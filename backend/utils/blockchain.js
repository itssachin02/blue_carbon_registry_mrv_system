const { ethers } = require("ethers");

// Connect to Polygon Mumbai testnet
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x" + "0".repeat(64);
const RPC_URL =
  process.env.BLOCKCHAIN_RPC_URL ||
  "https://rpc-mumbai.maticvigil.com";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
const NETWORK_ID = 80001; // Polygon Mumbai
const CHAIN_ID = 80001;

// Minimal ABI for verification
const CONTRACT_ABI = [
  {
    inputs: [
      { name: "projectId", type: "string" },
      { name: "carbonCredits", type: "uint256" },
      { name: "ipfsHash", type: "string" },
    ],
    name: "verifyProject",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "transferCredits",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
];

async function verifyProjectOnBlockchain(projectId, carbonCredits, ipfsHash) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Call verification function
    const tx = await contract.verifyProject(projectId, carbonCredits, ipfsHash);
    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Blockchain Verification Error:", error.message);
    throw new Error(`Blockchain verification failed: ${error.message}`);
  }
}

async function transferCreditsOnBlockchain(fromAddress, toAddress, amount) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    const tx = await contract.transferCredits(fromAddress, toAddress, amount);
    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      from: fromAddress,
      to: toAddress,
      amount: amount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Credit Transfer Error:", error.message);
    throw new Error(`Credit transfer failed: ${error.message}`);
  }
}

module.exports = {
  verifyProjectOnBlockchain,
  transferCreditsOnBlockchain,
};
