 const crypto = require("crypto");
const FaceBiometric = require("../models/FaceBiometric");
const { compareFaces } = require("../utils/faceRecognition");

const BIOMETRIC_EXPIRY_MINUTES = 10;

class BiometricService {
  /**
   * ======================================================
   * VERIFY FACE (PRE-REGISTRATION)
   * ======================================================
   */
  async verifyCustomerFace(imageBase64) {
    if (!imageBase64) {
      throw new Error("Face image is required");
    }

    // 1️⃣ Run face recognition (AI)
    const match = await compareFaces(imageBase64);

    if (!match.allowed) {
      return {
        allowed: false,
        reason: match.reason || "Face mismatch",
      };
    }

    // 2️⃣ Generate unique biometric hash
    const faceHash = crypto
      .createHash("sha256")
      .update(imageBase64)
      .digest("hex");

    // 3️⃣ Prevent duplicate registration
    const exists = await FaceBiometric.findOne({ faceHash });
    if (exists) {
      return {
        allowed: false,
        reason: "Face already registered",
      };
    }

    // 4️⃣ Save temporary biometric record
    const biometric = await FaceBiometric.create({
      faceHash,
      status: "pending",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return {
      allowed: true,
      biometricId: biometric._id,
    };
  }

  /**
   * ======================================================
   * LINK BIOMETRIC TO USER (AFTER REGISTRATION)
   * ======================================================
   */
  async attachBiometricToUser({ biometricId, userId }) {
    const biometric = await FaceBiometric.findById(biometricId);

    if (!biometric) {
      throw new Error("Biometric record not found");
    }

    if (biometric.expiresAt < new Date()) {
      throw new Error("Biometric session expired");
    }

    biometric.userId = userId;
    biometric.status = "linked";
    await biometric.save();

    return true;
  }
}

module.exports = new BiometricService();
