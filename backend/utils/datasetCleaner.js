function parseCsv(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(/,|;|\t/)
    .map((header) =>
      header
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/gi, "")
    );

  return lines.slice(1).map((line) => {
    const values = line.split(/,|;|\t/);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : "";
    });
    return row;
  });
}

const mammoth = require("mammoth");
const xlsx = require("xlsx");

function parseJson(content) {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) {
      return data;
    }
    if (typeof data === "object" && data !== null) {
      return [data];
    }
  } catch (error) {
    return [];
  }
  return [];
}

async function parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (error) {
    return "";
  }
}

function parseExcel(buffer) {
  try {
    const workbook = xlsx.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return [];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
    return rows;
  } catch (error) {
    return [];
  }
}

async function parseDatasetFile(content, filename) {
  const lowered = filename.toLowerCase();

  if (lowered.endsWith(".xls") || lowered.endsWith(".xlsx")) {
    return parseExcel(content);
  }

  let rawText = content;
  if (Buffer.isBuffer(content)) {
    if (lowered.endsWith(".docx")) {
      rawText = await parseDocx(content);
    } else {
      rawText = content.toString("utf-8");
    }
  }

  if (lowered.endsWith(".json")) {
    return parseJson(rawText);
  }
  if (lowered.endsWith(".csv") || lowered.endsWith(".txt") || lowered.endsWith(".docx")) {
    return parseCsv(rawText);
  }

  // Fallback: try JSON first, then CSV.
  const jsonRows = parseJson(rawText);
  if (jsonRows.length > 0) return jsonRows;
  return parseCsv(rawText);
}

function toNumber(value, defaultValue = 0) {
  if (value == null) return defaultValue;
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

function normalizeFieldName(key) {
  if (!key) return "";
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/gi, "");
}

function cleanRow(rawRow) {
  if (!rawRow || typeof rawRow !== "object") return null;

  const normalized = {};
  Object.entries(rawRow).forEach(([rawKey, rawValue]) => {
    const key = normalizeFieldName(rawKey);
    if (!key) return;
    let value = rawValue;
    if (typeof value === "string") {
      value = value.trim();
      if (value === "") {
        value = null;
      }
    }
    normalized[key] = value;
  });

  const name = normalized.name || normalized.project_name || normalized.title;
  if (!name) return null;

  return {
    name: String(name).trim(),
    location: normalized.location || normalized.site || normalized.region || "Not specified",
    area: toNumber(normalized.area || normalized.hectares || normalized.size, 0),
    carbonCredits: toNumber(
      normalized.carboncredits ||
        normalized.carbon_credits ||
        normalized.credits ||
        normalized.co2 ||
        0,
      0
    ),
    description:
      normalized.description || normalized.notes || normalized.project_description || "",
    ecosystemType:
      normalized.ecosystem_type ||
      normalized.ecosystem ||
      normalized.type ||
      "mangrove",
    latitude: toNumber(normalized.latitude, 0),
    longitude: toNumber(normalized.longitude, 0),
    status:
      normalized.status ||
      normalized.approval_status ||
      normalized.project_status ||
      "pending",
    raw: rawRow,
  };
}

function evaluateRowValidation(row) {
  const ecosystemThresholds = {
    mangrove: { min: 12, max: 20, tolerance: 18 },
    seagrass: { min: 5, max: 12, tolerance: 15 },
    saltmarsh: { min: 8, max: 15, tolerance: 16 },
    kelp: { min: 10, max: 18, tolerance: 17 },
    other: { min: 10, max: 20, tolerance: 20 },
  };

  const ecosystemKey = String(row.ecosystemType || "other").toLowerCase();
  const threshold = ecosystemThresholds[ecosystemKey] || ecosystemThresholds.other;
  const carbonPerHectare = row.area > 0 ? row.carbonCredits / row.area : 0;

  const issues = [];
  if (row.area <= 0) {
    issues.push("Area must be greater than 0 hectares");
  }
  if (row.area > 1000000) {
    issues.push("Area exceeds realistic threshold (1,000,000 ha)");
  }
  if (row.carbonCredits < 0) {
    issues.push("Carbon credits must be zero or positive");
  }
  if (carbonPerHectare < 0) {
    issues.push("Carbon per hectare cannot be negative");
  }
  if (carbonPerHectare > threshold.max) {
    issues.push(
      `Carbon per hectare (${carbonPerHectare.toFixed(2)} tCO2/ha) exceeds expected ${ecosystemKey} range (${threshold.min}-${threshold.max})`
    );
  }
  if (carbonPerHectare < threshold.min) {
    issues.push(
      `Carbon per hectare (${carbonPerHectare.toFixed(2)} tCO2/ha) is below expected ${ecosystemKey} range (${threshold.min}-${threshold.max})`
    );
  }

  const status = issues.length === 0 ? "accurate" : "inaccurate";

  return {
    status,
    issues,
    carbonPerHectare: parseFloat(carbonPerHectare.toFixed(2)),
    thresholdRange: {
      min: threshold.min,
      max: threshold.max,
    },
    ecosystemType: ecosystemKey,
  };
}

function cleanDataset(datasetRows) {
  const cleaned = [];
  const seenKeys = new Set();

  datasetRows.forEach((row, index) => {
    const cleanedRow = cleanRow(row);
    if (!cleanedRow) return;

    const dedupeKey = `${cleanedRow.name.toLowerCase()}|${String(
      cleanedRow.location
    ).toLowerCase()}`;
    if (seenKeys.has(dedupeKey)) return;
    seenKeys.add(dedupeKey);

    cleaned.push({
      ...cleanedRow,
      originalIndex: index,
      validation: evaluateRowValidation(cleanedRow),
    });
  });

  return cleaned;
}

function buildUploadSummary(originalRows, cleanedRows) {
  const accurateCount = cleanedRows.filter(
    (row) => row.validation?.status === "accurate"
  ).length;
  const inaccurateCount = cleanedRows.length - accurateCount;
  const flaggedRows = cleanedRows
    .filter((row) => row.validation?.status === "inaccurate")
    .slice(0, 10)
    .map((row) => ({
      index: row.originalIndex != null ? row.originalIndex + 1 : null,
      name: row.name,
      ecosystemType: row.ecosystemType,
      carbonPerHectare: row.validation?.carbonPerHectare,
      thresholdRange: row.validation?.thresholdRange,
      issues: row.validation?.issues,
    }));

  return {
    originalCount: originalRows.length,
    cleanedCount: cleanedRows.length,
    removedDuplicates: originalRows.length - cleanedRows.length,
    cleanedAt: new Date().toISOString(),
    validation: {
      totalCleaned: cleanedRows.length,
      accurateCount,
      inaccurateCount,
      overallStatus: inaccurateCount > 0 ? "Inaccurate" : "Accurate",
      flaggedRows,
    },
  };
}

module.exports = { parseDatasetFile, cleanDataset, buildUploadSummary };