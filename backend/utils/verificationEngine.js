const axios = require("axios");
const { verifyMRVData: runLocalVerification } = require("./mrvVerification");

const MODEL_API_URL = process.env.MODEL_API_URL || "";
const SATELLITE_API_URL = process.env.SATELLITE_API_URL || "";
const SATELLITE_API_KEY = process.env.SATELLITE_API_KEY || "";

const normalizeEcosystem = (value) => {
  if (!value) return "mangrove";
  return String(value).toLowerCase();
};

const buildInferencePayload = (data) => ({
  location: data.location,
  ecosystemType: normalizeEcosystem(data.ecosystemType),
  area: Number(data.area),
  biomass: Number(data.biomass),
  reportedCarbon: Number(data.reportedCarbon),
  source: "mrv-verification-ui",
});

const fetchRemoteInference = async (data) => {
  if (!MODEL_API_URL) return null;
  try {
    const payload = buildInferencePayload(data);
    const response = await axios.post(MODEL_API_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 20000,
    });
    if (response?.data) {
      return {
        ...response.data,
        modelVersion: response.data.modelVersion || response.data.version || "remote-model",
        inferenceSource: "remote-model",
      };
    }
    return null;
  } catch (error) {
    console.error("Remote inference error:", error.message || error);
    return null;
  }
};

const fetchSatelliteEvidence = async (data) => {
  if (!SATELLITE_API_URL) return null;
  try {
    const response = await axios.post(
      SATELLITE_API_URL,
      {
        location: data.location,
        ecosystemType: normalizeEcosystem(data.ecosystemType),
        area: Number(data.area),
      },
      {
        headers: {
          "Content-Type": "application/json",
          ...(SATELLITE_API_KEY ? { Authorization: `Bearer ${SATELLITE_API_KEY}` } : {}),
        },
        timeout: 20000,
      }
    );

    if (response?.data) {
      return {
        source: response.data.source || "external-satellite-service",
        satelliteId: response.data.satelliteId,
        ndvi: response.data.ndvi,
        biomassEstimate: response.data.biomassEstimate,
        areaEstimate: response.data.areaEstimate,
        raw: response.data,
      };
    }
    return null;
  } catch (error) {
    console.error("Satellite evidence error:", error.message || error);
    return null;
  }
};

const runVerificationPipeline = async (input) => {
  const payload = buildInferencePayload(input);
  let inferenceResult = await fetchRemoteInference(payload);

  if (!inferenceResult) {
    inferenceResult = runLocalVerification(payload);
    inferenceResult.modelVersion = "local-heuristic-v1";
    inferenceResult.inferenceSource = "local-heuristic";
  }

  const satelliteEvidence = await fetchSatelliteEvidence(payload);

  return {
    verificationResult: inferenceResult,
    modelVersion: inferenceResult.modelVersion || "unknown",
    inferenceSource: inferenceResult.inferenceSource || "local-heuristic",
    satelliteEvidence,
  };
};

module.exports = {
  runVerificationPipeline,
  fetchRemoteInference,
  fetchSatelliteEvidence,
};
