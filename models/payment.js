  const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    controlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
      required: false
    },

    amountPaid: {
      type: Number,
      required: true
    },

    amount: {
      type: Number,
      default: 0
    },

    method: {
      type: String,
      enum: ["mobile_money", "bank", "cash"],
      default: "mobile_money"
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },

    paymentType: {
      type: String,
      enum: ["FULL", "PARTIAL", "OVERPAYMENT"],
      default: "FULL"
    },

    reference: {
      type: String,
      required: true,
      unique: true
    },

    transactionId: {
      type: String,
      index: true,
      sparse: true
    },

    appliedBreakdown: {
      principal: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
      penalties: { type: Number, default: 0 }
    },
    payout: {
      agentAmount: {
        type: Number,
        default: 0, // 💰 pesa ya bidhaa → wakala
      },
      companyAmount: {
        type: Number,
        default: 0, // 🏦 ada + penalties → kampuni
      },
      mode: {
        type: String,
        enum: ["DIRECT", "DEFERRED"],
        default: "DIRECT",
      },
    },

    processedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ customer: 1 });
paymentSchema.index({ loan: 1 });
paymentSchema.index({ reference: 1 });

 module.exports =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
