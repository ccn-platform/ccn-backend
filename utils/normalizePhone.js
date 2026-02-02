 /**
 * normalizePhone
 * =====================================================
 * Tanzania Phone Normalizer (LENIENT INPUT, STRICT OUTPUT)
 *
 * OUTPUT FORMAT (ONLY):
 *   255XXXXXXXXX
 *
 * SUPPORTED MOBILE PREFIXES (TZ):
 *   Vodacom → 074, 075, 076, 079
 *   Airtel  → 068, 069, 078
 *   Tigo    → 065, 067, 071
 *   Halotel → 061, 062, 063
 *   TTCL    → 073
 *   Zantel  → 077
 *
 * NOTES:
 * - Mobile numbers ONLY (intentional business rule)
 * - Throws clear errors for validation contexts
 * - O(1) performance
 */

const TZ_MOBILE_PREFIXES = [
  "61", "62", "63",       // Halotel
  "65", "67", "71",       // Tigo
  "68", "69", "78",       // Airtel
  "73",                  // TTCL
  "74", "75", "76", "79", // Vodacom
  "77",                  // Zantel
];

function normalizePhone(phone) {
  if (phone === null || phone === undefined) {
    throw new Error("Phone number is required");
  }

  // 1️⃣ Convert to string & clean common separators
  let cleaned = String(phone)
    .trim()
    .replace(/[\s\-().]/g, "");

  if (!cleaned) {
    throw new Error("Phone number is empty");
  }

  // 2️⃣ Remove leading "+"
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.slice(1);
  }

  // 3️⃣ Normalize formats to 255XXXXXXXXX
  // 0XXXXXXXXX → 255XXXXXXXXX
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "255" + cleaned.slice(1);
  }

  // 6XXXXXXXX / 7XXXXXXXX → 255XXXXXXXXX
  if (cleaned.length === 9 && /^[67]\d{8}$/.test(cleaned)) {
    cleaned = "255" + cleaned;
  }

  // 4️⃣ Final length check
  if (cleaned.length !== 12) {
    throw new Error(
      "Invalid TZ phone number length. Expected 9, 10, or 12 digits."
    );
  }

  // 5️⃣ Country code check
  if (!cleaned.startsWith("255")) {
    throw new Error("Invalid country code. Only Tanzania (255) is supported.");
  }

  // 6️⃣ Strict mobile prefix validation
  const prefix = cleaned.slice(3, 5); // after 255

  if (!TZ_MOBILE_PREFIXES.includes(prefix)) {
    throw new Error(
      `Invalid Tanzania mobile prefix (${prefix}). Mobile numbers only are allowed.`
    );
  }

  // 7️⃣ Final numeric safety check
  if (!/^\d{12}$/.test(cleaned)) {
    throw new Error("Phone number contains invalid characters.");
  }

  return cleaned;
}

module.exports = normalizePhone;
