/**
 * MRV Verification Service
 * Uses scientific formulas and ML-style regression reasoning to verify carbon data
 */

const verifyMRVData = (inputData) => {
  const {
    location,
    ecosystemType,
    area,
    biomass,
    reportedCarbon,
  } = inputData;

  try {
    // Step 1: Validate Inputs
    const validation = validateInputs(area, biomass, reportedCarbon);
    if (!validation.valid) {
      return {
        status: "Rejected",
        expectedCarbon: null,
        differencePercentage: null,
        reason: validation.error,
        validationErrors: validation.errors,
        timestamp: new Date().toISOString(),
      };
    }

    // Step 2: Calculate Expected Carbon using scientific formula
    // Expected Carbon = Area × Biomass × 0.47 (carbon fraction)
    const expectedCarbon = area * biomass * 0.47;

    // Step 3: Calculate Difference Percentage
    const absoluteDifference = Math.abs(reportedCarbon - expectedCarbon);
    const differencePercentage = (absoluteDifference / expectedCarbon) * 100;

    // Step 4: Apply Machine Learning Logic (Regression-Style Reasoning)
    // Consider ecosystem-specific tolerance ranges
    const ecosystemTolerances = {
      mangrove: { min: 12, max: 20, tolerance: 18 },
      seagrass: { min: 5, max: 12, tolerance: 15 },
      saltmarsh: { min: 8, max: 15, tolerance: 16 },
      kelp: { min: 10, max: 18, tolerance: 17 },
      other: { min: 10, max: 20, tolerance: 20 },
    };

    const ecosystemKey = ecosystemType?.toLowerCase() || "other";
    const toleranceRange = ecosystemTolerances[ecosystemKey] || ecosystemTolerances.other;

    // Step 5: Apply Validation Rules
    let status = "Verified";
    let reason = "Carbon data is consistent and realistic.";
    let insights = {
      biomassRealistic: isBiomassRealistic(ecosystemType, biomass),
      areaRealistic: area > 0 && area < 1000000,
      carbonRangeGood: reportedCarbon > 0 && reportedCarbon < area * 50, // Sanity check
    };

    // Check if reported carbon is within realistic environmental limits
    const maxPossibleCarbon = area * 50; // Max realistic limit
    const minPossibleCarbon = area * 0.1; // Min realistic limit

    if (reportedCarbon < minPossibleCarbon || reportedCarbon > maxPossibleCarbon) {
      status = "Rejected";
      reason = `Carbon value outside realistic environmental limits (${minPossibleCarbon.toFixed(2)} - ${maxPossibleCarbon.toFixed(2)} tons). Reported: ${reportedCarbon} tons`;
      insights.carbonRangeGood = false;
    }
    // Check if difference exceeds tolerance threshold
    else if (differencePercentage > toleranceRange.tolerance) {
      status = "Suspicious";
      reason = `High deviation from expected carbon (${differencePercentage.toFixed(2)}% difference). Expected: ${expectedCarbon.toFixed(2)} tons, Reported: ${reportedCarbon} tons. This may indicate data anomalies or additional environmental factors.`;
      insights.tolerance = false;
    }

    // Step 6: Cross-validate with ecosystem-specific bounds
    if (status === "Verified") {
      const carbonPerHectare = reportedCarbon / area;
      if (carbonPerHectare < toleranceRange.min || carbonPerHectare > toleranceRange.max) {
        status = "Suspicious";
        reason = `Carbon per hectare (${carbonPerHectare.toFixed(2)} tons/ha) outside typical range for ${ecosystemKey} (${toleranceRange.min}-${toleranceRange.max} tons/ha).`;
        insights.ecosystemBoundsGood = false;
      } else {
        insights.ecosystemBoundsGood = true;
      }
    }

    return {
      status,
      expectedCarbon: parseFloat(expectedCarbon.toFixed(2)),
      reportedCarbon: parseFloat(reportedCarbon.toFixed(2)),
      differencePercentage: parseFloat(differencePercentage.toFixed(2)),
      toleranceThreshold: toleranceRange.tolerance,
      carbonPerHectare: parseFloat((reportedCarbon / area).toFixed(2)),
      ecosystemReference: {
        type: ecosystemKey,
        minRange: toleranceRange.min,
        maxRange: toleranceRange.max,
      },
      reason,
      insights,
      metadata: {
        location,
        ecosystemType,
        area,
        biomass,
        verifiedAt: new Date().toISOString(),
        verificationMethod: "AI-MRV Verification Service v1.0",
      },
    };
  } catch (error) {
    return {
      status: "Rejected",
      expectedCarbon: null,
      differencePercentage: null,
      reason: `Verification error: ${error.message}`,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Validate Input Parameters
 */
const validateInputs = (area, biomass, reportedCarbon) => {
  const errors = [];

  if (!area || isNaN(area) || area <= 0) {
    errors.push("Area must be a positive number");
  }
  if (!biomass || isNaN(biomass) || biomass <= 0) {
    errors.push("Biomass must be a positive number");
  }
  if (reportedCarbon === undefined || isNaN(reportedCarbon) || reportedCarbon < 0) {
    errors.push("Reported Carbon must be a non-negative number");
  }
  if (area > 1000000) {
    errors.push("Area exceeds maximum realistic value (1,000,000 ha)");
  }
  if (biomass > 500) {
    errors.push("Biomass exceeds maximum realistic value (500 tons/ha)");
  }

  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors[0] : null,
    errors,
  };
};

/**
 * Check if Biomass is Realistic for Ecosystem Type
 */
const isBiomassRealistic = (ecosystemType, biomass) => {
  const biomassRanges = {
    mangrove: { min: 60, max: 250 },
    seagrass: { min: 20, max: 150 },
    saltmarsh: { min: 40, max: 180 },
    kelp: { min: 50, max: 200 },
    other: { min: 10, max: 300 },
  };

  const key = ecosystemType?.toLowerCase() || "other";
  const range = biomassRanges[key] || biomassRanges.other;

  return biomass >= range.min && biomass <= range.max;
};

/**
 * Generate Confidence Score (0-100)
 */
const calculateConfidenceScore = (verificationResult) => {
  if (verificationResult.status === "Rejected") return 0;
  if (verificationResult.status === "Suspicious") return 40 + (100 - Math.min(verificationResult.differencePercentage, 100) / 100 * 60);
  
  // Verified
  const baseScore = 95;
  const deviation = Math.min(verificationResult.differencePercentage / 100, 1);
  return Math.round(baseScore - deviation * 20);
};

module.exports = {
  verifyMRVData,
  validateInputs,
  isBiomassRealistic,
  calculateConfidenceScore,
};
