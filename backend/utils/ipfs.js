const axios = require("axios");
const FormData = require("form-data");

const uploadToIPFS = async (file) => {
  try {
    const data = new FormData();
    data.append("file", file.buffer, file.originalname);

    const res = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      data,
      {
        maxBodyLength: "Infinity",
        headers: {
          ...data.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY,
          pinata_secret_api_key:
            process.env.PINATA_SECRET_KEY || process.env.PINATA_SECRET_API_KEY,
        },
      }
    );

    return res.data.IpfsHash;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = uploadToIPFS;