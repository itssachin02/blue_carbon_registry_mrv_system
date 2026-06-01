const { ethers } = require("ethers");

// 👇 TERA CONTRACT ADDRESS
const contractAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";

// 👇 ABI (jo tu abhi copy kiya)
const abi = require("./CarbonRegistry.json").abi;

// 👇 Local blockchain connection
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// 👇 Hardhat account private key
const signer = new ethers.Wallet(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);

// 👇 Contract instance
const contract = new ethers.Contract(contractAddress, abi, signer);

// 👇 Function to store IPFS hash
async function storeHash(projectName, ipfsHash) {
  const tx = await contract.registerProject(projectName, ipfsHash);
  await tx.wait();
  return tx.hash;
}

module.exports = { storeHash };