 const crypto = require("crypto");

/**
 * ======================================================
 * SIMPLE FACE RECOGNITION (PLACEHOLDER)
 * ======================================================
 * ⚠️ Hii ni lightweight implementation
 * Kwa production unaweza kubadilisha na:
 * - AWS Rekognition
 * - FaceNet
 * - InsightFace
 */

module.exports.compareFaces = async function compareFaces(imageBase64) {
  if (!imageBase64) {
    throw new Error("No image provided");
  }

  // 🔐 Generate deterministic hash
  const hash = crypto
    .createHash("sha256")
    .update(imageBase64)
    .digest("hex");

  /**
   * Kwa sasa tunarudisha tu hash
   * Later unaweza kuongeza AI model comparison
   */
  return {
    allowed: true,
    hash,
  };
};
