 const mongoose = require("mongoose");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ ADD THIS

const UserSchema = new mongoose.Schema(
  {
    systemId: { type: String, unique: true },

    fullName: { type: String, required: true },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    phoneNormalized: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      default: null,
    },

    nationalId: { type: String, unique: true, sparse: true },

    pin: { type: String, required: true },

    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      required: true,
    },

        /**
     * ======================================================
     * 🆕 LEGAL ACCEPTANCE (PRIVACY & TERMS)
     * ======================================================
     * - Stored once per user
     * - Used to enforce re-accept on version change
     */
    legalAcceptance: {
      privacyVersion: { type: String, default: null },
      termsVersion: { type: String, default: null },
      acceptedAt: { type: Date, default: null },
    },

    isLocked: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },

    businessName: { type: String, default: null },
    businessCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessCategory",
      default: null,
    },

    merchantInfo: {
      tin: { type: String, default: null },
      businessLicense: { type: String, default: null },
      location: { type: String, default: null },
    },

    adminLevel: { type: Number, default: null },

    /**
     * ======================================================
     * 🔔 PUSH TOKENS (BACKWARD + NEW)
     * ======================================================
     */
    pushToken: { type: String, default: null },       // OLD (do not remove)
    expoPushToken: { type: String, default: null },   // ⭐ NEW (USED BY SERVICES)

    /**
     * ======================================================
     * 🆕 FORGOT PIN / RESET PIN (SAFE ADD)
     * ======================================================
     */
    resetPinCode: { type: String, default: null },
    resetPinExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * ======================================================
 * ⭐ AUTO NORMALIZE PHONE BEFORE SAVE
 * ======================================================
 */
UserSchema.pre("save", function (next) {
  if (this.phone && !this.phoneNormalized) {
    try {
      this.phoneNormalized = normalizePhone(this.phone);
    } catch (err) {
      return next(err);
    }
  }

  // ⭐ SYNC TOKENS (SAFE)
  if (this.pushToken && !this.expoPushToken) {
    this.expoPushToken = this.pushToken;
  }

  if (this.expoPushToken && !this.pushToken) {
    this.pushToken = this.expoPushToken;
  }

  next();
});

module.exports = mongoose.model("User", UserSchema);
