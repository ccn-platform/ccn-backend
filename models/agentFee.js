 const mongoose = require("mongoose");

const AgentFeeSchema = new mongoose.Schema(
  {
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    startDate: { type: Date, default: null, index: true },
    endDate: { type: Date, default: null, index: true },

    status: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive",
      index: true,
    },

    // ✅ FIXED
    plan: {
  type: String,
  enum: [
    "FREE_TRIAL",   // ✅ ONGEZA HII TU
    "WEEKLY",
    "MONTHLY",
    "SEMI_ANNUAL",
    "ANNUAL",
  ],
  required: false,
  index: true,
},

    amountPaid: { type: Number, default: 0 },

    lastPaymentRef: { type: String, default: null },

    lastControlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
      default: null,
    },

    renewalCount: { type: Number, default: 0 },

    notes: { type: String, default: null },

    activatedAt: { type: Date, default: null, index: true },

    source: {
      type: String,
      enum: ["SYSTEM", "PAYMENT", "ADMIN"],
      default: "SYSTEM",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AgentFee ||
  mongoose.model("AgentFee", AgentFeeSchema);
