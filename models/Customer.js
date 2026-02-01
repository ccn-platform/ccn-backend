 // models/Customer.js

const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    customerId: {
      type: String,
      unique: true,
    },

    // ⭐ NEW — Normalized phone (2557XXXXXXXX)
    // Safe addition — does NOT break existing data
    normalizedPhone: {
      type: String,
      index: true,
      sparse: true, // allows old records without this field
    },

    address: { type: String, default: null },
    profilePhoto: { type: String, default: null },

    // Financial Tracking
    totalDebt: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },

    // Control Numbers active count
    activeControlNumbers: { type: Number, default: 0 },

    // Loan Eligibility Lock
    isBlockedFromLoan: { type: Boolean, default: false },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

/**
 * ⭐ SAFE UNIQUE INDEX
 * Simu moja = customer mmoja
 * Haitaathiri records za zamani
 */
CustomerSchema.index(
  { normalizedPhone: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Customer", CustomerSchema);
