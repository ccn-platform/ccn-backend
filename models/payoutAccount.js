 // models/PayoutAccount.js

const mongoose = require("mongoose");

/**
 * ======================================================
 * PAYOUT ACCOUNT MODEL
 * ======================================================
 * - Separate collection (NOT embedded in Agent)
 * - Designed for 100M+ records
 * - Indexed for fast lookups
 * - Safe for Mobile Money + Bank
 * ======================================================
 */

const PayoutAccountSchema = new mongoose.Schema(
  {
    /**
     * 🔗 OWNER (AGENT)
     * Indexed because:
     * - /agents/me/payout-accounts
     * - payout checks during dashboard load
     */
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    /**
     * TYPE OF PAYOUT
     */
    type: {
      type: String,
      enum: ["mobile_money", "bank"],
      required: true,
      index: true,
    },

    /**
     * MOBILE MONEY FIELDS
     */
    provider: {
      type: String,
      index: true, // M-Pesa, Tigo, Airtel etc
    },

    /**
     * 🔐 ACCOUNT NUMBER (CORE FIELD)
     * - Merchant number / Paybill / Bank account
     * - Stored as STRING (never Number)
     */
    accountNumber: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    /**
     * BANK ONLY
     */
    bankName: {
      type: String,
      index: true,
    },

    accountName: {
      type: String,
      trim: true,
    },

    /**
     * ⭐ PRIMARY PAYOUT FLAG
     * - Only ONE per agent
     */
    isPrimary: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * 🔒 SOFT CONTROL
     */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /**
     * 🔍 AUDIT / OPS
     */
    createdByIp: String,
    createdByDevice: String,
  },
  {
    timestamps: true, // createdAt, updatedAt
    versionKey: false,
  }
);

/**
 * ======================================================
 * 🆕 SAFE NORMALIZER (ADD ONLY)
 * ======================================================
 * - Haisabishi breaking change
 * - Inafanya duplicate check iwe sahihi
 * - Inazuia "123 456" vs "123456"
 */
PayoutAccountSchema.pre("save", function (next) {
  if (this.accountNumber && typeof this.accountNumber === "string") {
    this.accountNumber = this.accountNumber
      .replace(/\s+/g, "")
      .replace(/[-_]/g, "")
      .trim();
  }
  next();
});

/**
 * ======================================================
 * 🚀 COMPOUND INDEXES (CRITICAL FOR SCALE)
 * ======================================================
 */

// One primary payout per agent (FAST LOOKUP)
PayoutAccountSchema.index(
  { agent: 1, isPrimary: 1 },
  { background: true }
);

// Prevent duplicate account per agent
PayoutAccountSchema.index(
  { agent: 1, accountNumber: 1 },
  { unique: true, background: true }
);

// Fast provider analytics (optional but cheap)
PayoutAccountSchema.index(
  { provider: 1, isActive: 1 },
  { background: true }
);

module.exports = mongoose.model(
  "PayoutAccount",
  PayoutAccountSchema
);
