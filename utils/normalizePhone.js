  /**
 * normalizePhone
 * =====================================================
 * Tanzania Phone Normalizer + Network Detector
 *
 * OUTPUT FORMAT:
 *   255XXXXXXXXX
 *
 * FEATURES
 * - Normalize different phone formats
 * - Strict Tanzania mobile validation
 * - Detect mobile operator
 * - Production safe
 */

// Supported prefixes
const TZ_MOBILE_PREFIXES = Object.freeze(new Set([
  "61","62","63",       // Halotel
  "65","67","71",       // Tigo
  "68","69","78",       // Airtel
  "73",                 // TTCL
  "74","75","76","79",  // Vodacom
  "77"                  // Zantel
]));

// Fast network lookup
const NETWORK_MAP = Object.freeze({
  "74":"VODACOM",
  "75":"VODACOM",
  "76":"VODACOM",
  "79":"VODACOM",

  "65":"TIGO",
  "67":"TIGO",
  "71":"TIGO",

  "68":"AIRTEL",
  "69":"AIRTEL",
  "78":"AIRTEL",

  "61":"HALOTEL",
  "62":"HALOTEL",
  "63":"HALOTEL",

  "73":"TTCL",

  "77":"ZANTEL"
});

/**
 * Detect network
 */
function detectNetwork(phone) {
  const prefix = phone.slice(3,5);
  return NETWORK_MAP[prefix] || "UNKNOWN";
}

/**
 * Normalize phone number
 */
function normalizePhone(phone) {

  if (phone === null || phone === undefined) {
    throw new Error("Phone number is required");
  }

  // Clean input
  let cleaned = String(phone)
    .trim()
    .replace(/[\s\-().]/g, "");

  if (!cleaned) {
    throw new Error("Phone number is empty");
  }

  // Remove +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  // 0XXXXXXXXX → 255XXXXXXXXX
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "255" + cleaned.slice(1);
  }

  // 7XXXXXXXX → 2557XXXXXXXX
  if (cleaned.length === 9 && /^[67]\d{8}$/.test(cleaned)) {
    cleaned = "255" + cleaned;
  }

  // Length validation
  if (cleaned.length !== 12) {
    throw new Error(
      "Invalid TZ phone number length. Expected 9, 10, or 12 digits."
    );
  }

  // Numeric validation
  if (!/^\d{12}$/.test(cleaned)) {
    throw new Error("Phone number contains invalid characters.");
  }

  // Country code validation
  if (!cleaned.startsWith("255")) {
    throw new Error("Invalid country code. Only Tanzania (255) is supported.");
  }

  // Prefix validation
  const prefix = cleaned.slice(3,5);

  if (!TZ_MOBILE_PREFIXES.has(prefix)) {
    throw new Error(
      `Invalid Tanzania mobile prefix (${prefix}). Mobile numbers only are allowed.`
    );
  }

  return {
    phone: cleaned,
    network: detectNetwork(cleaned)
  };
}

module.exports = {
  normalizePhone,
  detectNetwork
};
