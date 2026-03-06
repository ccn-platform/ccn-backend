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
       min: 0,
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
provider: {
  type: String,
  enum: ["MPESA", "TIGOPESA", "AIRTELMONEY", "HALOPESA", "BANK", "SYSTEM"],
  default: "SYSTEM",
  index: true,
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
     unique: true,
     index: true,
   },

    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
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
paymentSchema.index({ provider: 1, providerReference: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ reference: 1 }, { unique: true }); // idempotency
paymentSchema.index({ loan: 1, createdAt: -1 });        // history per loan
paymentSchema.index({ customer: 1 });                   // customer reports
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ controlNumber: 1 });
paymentSchema.index({ loan: 1, status: 1 });
module.exports =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);
