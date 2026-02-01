 // models/AgentPayout.js
const mongoose = require("mongoose");

const AgentPayoutSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
      index: true, // 🆕 ADD ONLY — performance (cron, dashboard)
    },

    payoutAccount: {
      type: Object, // snapshot (SAFE)
      required: true,
    },

    // ==============================
    // 🆕 ADD ONLY — FAILURE HANDLING
    // ==============================
    failureReason: {
      type: String,
      default: null,
    },

    // ==============================
    // 🆕 ADD ONLY — WHO PROCESSED PAYOUT
    // (system / admin)
    // ==============================
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    reference: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * ======================================================
 * 🆕 ADD ONLY — INDEXES (SAFE)
 * ======================================================
 */
AgentPayoutSchema.index({ agent: 1, status: 1 });
AgentPayoutSchema.index({ loan: 1 });
AgentPayoutSchema.index({ payment: 1 });

module.exports = mongoose.model("AgentPayout", AgentPayoutSchema);
