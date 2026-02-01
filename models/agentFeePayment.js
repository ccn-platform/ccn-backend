 const mongoose = require("mongoose");

const AgentFeePaymentSchema = new mongoose.Schema(
  {
    // 🔗 Agent aliyelipa
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    // 🔗 AgentFee record
    agentFee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentFee",
      required: true,
      index: true,
    },

    // 💳 Plan iliyolipiwa
    plan: {
      type: String,
      enum: ["WEEKLY", "MONTHLY", "SEMI_ANNUAL", "ANNUAL"],
      required: true,
      index: true,
    },

    // 💰 Kiasi kilicholipwa (snapshot)
    amount: {
      type: Number,
      required: true,
    },

    amountSnapshot: {
      type: Number,
      required: true,
    },

    // ⏱ Muda wa plan wakati wa malipo
    durationSnapshot: {
      value: {
        type: Number,
        required: true,
      },
      unit: {
        type: String,
        enum: ["week", "month", "year"],
        required: true,
      },
    },

    // 🧾 Control number
    controlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
      default: null,
    },

    // 🔖 Internal reference
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 🔁 Provider transaction ID
    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },

    // 💸 Njia ya malipo
    paymentMethod: {
      type: String,
      enum: ["mobile_money", "bank", "cash", "manual"],
      default: "mobile_money",
    },

    // 🏦 Provider (azampay, mpesa, internal, n.k.)
    provider: {
      type: String,
      default: "internal",
      index: true,
    },

    // 🔐 Hali ya malipo
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },

    // ⏱ Lini malipo yalithibitishwa
    processedAt: {
      type: Date,
      default: null,
    },

    // 🧭 Chanzo cha malipo
    source: {
      type: String,
      enum: ["AGENT", "ADMIN", "SYSTEM"],
      default: "AGENT",
      index: true,
    },

    // 📝 Maelezo ya ziada
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ⚡ Indexes
AgentFeePaymentSchema.index({ agent: 1, createdAt: -1 });
AgentFeePaymentSchema.index({ agentFee: 1, status: 1 });
AgentFeePaymentSchema.index({ plan: 1, status: 1 });
AgentFeePaymentSchema.index({ source: 1, createdAt: -1 });

module.exports =
  mongoose.models.AgentFeePayment ||
  mongoose.model("AgentFeePayment", AgentFeePaymentSchema);
