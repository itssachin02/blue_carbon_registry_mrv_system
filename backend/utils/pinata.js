const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const PINATA_API_KEY = process.env.PINATA_API_KEY || process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY =
  process.env.PINATA_SECRET_KEY || process.env.PINATA_SECRET_API_KEY || "test_secret";

async function uploadFileToPinata(filePath, fileName) {
  try {
    const data = new FormData();
    data.append("file", fs.createReadStream(filePath));
    data.append("pinataMetadata", JSON.stringify({ name: fileName }));

    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: Infinity,
        headers: {
          ...data.getHeaders(),
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
      pinSize: response.data.PinSize,
      timestamp: response.data.Timestamp,
    };
  } catch (error) {
    console.error("IPFS Upload Error:", error.message);
    throw error;
  }
}

async function uploadJSONToPinata(jsonData, name) {
  try {
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      jsonData,
      {
        headers: {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );

    return {
      success: true,
      ipfsHash: response.data.IpfsHash,
    };
  } catch (error) {
    console.error("IPFS JSON Upload Error:", error.message);
    throw error;
  }
}

module.exports = { uploadFileToPinata, uploadJSONToPinata };
