    

 
 const mongoose = require("mongoose");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ ADD THIS
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
     systemId: { type: String },

    fullName: { type: String, required: true },

    phone: {
      type: String,
      required: true,
     },

phoneNormalized: {
  type: String,
  default: null,
},
    
    nationalId: {
  type: String,
  default: undefined, // muhimu sana
},

    pin: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["customer", "agent", "admin"],
      required: true,
    },

    loginAttempts: { type: Number, default: 0 },
    blockedUntil: { type: Date, default: null },

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
 resetPinCode: { type: String, select: false, default: null },
    resetPinExpiresAt: { type: Date, default: null },
/**
 * ======================================================
 * 🗑️ ACCOUNT DELETE REQUEST
 * ======================================================
 */
deleteRequested: { type: Boolean, default: false },
deleteRequestedAt: { type: Date, default: null },


  },
  { timestamps: true }
);

/**
 * ======================================================
 * ⭐ AUTO NORMALIZE PHONE BEFORE SAVE
 * ======================================================
 */
 UserSchema.pre("save", async function (next) {

  // 🔐 HASH PIN
  if (this.isModified("pin")) {
    this.pin = await bcrypt.hash(this.pin, 12);
  }

  // 📱 Normalize phone
  if (this.isModified("phone")) {
    try {
      this.phoneNormalized = normalizePhone(this.phone);
    } catch (err) {
      return next(err);
    }
  }

  // 🔄 Sync push tokens
  if (this.pushToken && !this.expoPushToken) {
    this.expoPushToken = this.pushToken;
  }

  if (this.expoPushToken && !this.pushToken) {
    this.pushToken = this.expoPushToken;
  }

  next();
});

// 🔐 Compare PIN method
UserSchema.methods.comparePin = async function (enteredPin) {
  return await bcrypt.compare(enteredPin, this.pin);
};
   
 // ===============================
// 📊 INDEXES FOR PRODUCTION
// ===============================
 UserSchema.index(
  { phoneNormalized: 1 },
  { unique: true, sparse: true }
);
// login + search speed
 
// admin filters
UserSchema.index({ isBlocked: 1 });
UserSchema.index({ isLocked: 1 });
UserSchema.index({ blockedUntil: 1 });
// delete cleanup
UserSchema.index({ deleteRequested: 1 });

// business users
UserSchema.index({ businessCategory: 1 });

UserSchema.index({ phoneNormalized: 1, isBlocked: 1 });
// push notification performance
 
UserSchema.index({ expoPushToken: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ resetPinExpiresAt: 1 });
UserSchema.index({ systemId: 1 }, { unique: true });
// unique only when exists
UserSchema.index(
  { nationalId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("User", UserSchema);
