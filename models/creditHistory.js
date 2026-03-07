  const mongoose = require("mongoose");

const creditHistorySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true, // ⭐ one summary per customer
    },

    totalLoans: {
      type: Number,
      default: 0,
    },

    latePayments: {
      type: Number,
      default: 0,
    },

    defaults: {
      type: Number,
      default: 0,
    },

    averageRepaymentTime: {
      type: Number,
      default: 0, // in days
    },

    // ======================================================
    // 🆕 ADD ONLY — SUMMARY METADATA (SAFE)
    // ======================================================

    // When this summary was last recalculated
    lastUpdatedAt: {
      type: Date,
      default: null,
    },

    // Reference to the most recent loan used in calculation
    lastLoan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
    },

    // Last time customer made a payment
    lastPaymentAt: {
      type: Date,
      default: null,
    },

    // Snapshot of risk band (informational only)
    riskBand: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
  },
  { timestamps: true }
);

 module.exports =
mongoose.models.CreditHistory ||
mongoose.model("CreditHistory", creditHistorySchema);
