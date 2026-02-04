  const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    controlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
      default: null,
    },

    amountPaid: {
      type: Number,
      required: true,
    },

    amount: {
      type: Number,
      default: 0,
    },

    method: {
      type: String,
      enum: ["mobile_money", "bank", "cash", "adjustment"],
      default: "mobile_money",
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },

    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL", "OVERPAYMENT", "ADJUSTMENT"],
      default: "FULL",
    },

    reference: {
      type: String,
      required: true,
    },

    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },

    appliedBreakdown: {
      principal: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
      penalties: { type: Number, default: 0 },
    },

    payout: {
      agentAmount: {
        type: Number,
        default: 0,
      },
      companyAmount: {
        type: Number,
        default: 0,
      },
      mode: {
        type: String,
        enum: ["DIRECT", "DEFERRED", "NONE"],
        default: "DIRECT",
      },
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// =========================
// 🔥 INDEXES (MILLIONS SCALE)
// =========================
paymentSchema.index({ reference: 1 }, { unique: true }); // idempotency
paymentSchema.index({ loan: 1, createdAt: -1 });        // history per loan
paymentSchema.index({ customer: 1 });                   // customer reports

module.exports =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
