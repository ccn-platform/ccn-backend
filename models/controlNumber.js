 const mongoose = require("mongoose");

const ControlNumberSchema = new mongoose.Schema(
  {
    // 🔗 OPTIONAL — ipo tu kama ni Loan
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: false, // ✅ FIXED (WAS true)
      index: true,
    },

    // 🔗 Mteja / Agent anayelipa
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // 🔖 Control number reference
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 💰 Kiasi cha malipo
    amount: {
      type: Number,
      required: true,
    },

    // 🔐 Status ya control number
    status: {
      type: String,
      enum: ["active", "expired", "paid"],
      default: "active",
      index: true,
    },

    // 🧭 CHANZO CHA MALIPO
    // LOAN | AGENT_FEE | SUBSCRIPTION | SYSTEM
    source: {
      type: String,
      enum: ["LOAN", "AGENT_FEE", "SUBSCRIPTION", "SYSTEM"],
      default: "LOAN",
      index: true,
    },

    // ======================================================
    // EXPIRY & PAYMENT METADATA (HAIJAGUSWA)
    // ======================================================

    expiryTime: {
      type: Date,
      default: null,
      index: true,
    },

    loanDueDate: {
      type: Date,
      default: null,
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    issuedAt: {
      type: Date,
      default: () => new Date(),
    },

    paymentReference: {
      type: String,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// ==============================
// INDEXES (HAIJABADILIKA LOGIC)
// ==============================
ControlNumberSchema.index({ customer: 1, status: 1 });
ControlNumberSchema.index({ loan: 1, status: 1 });
ControlNumberSchema.index({ status: 1, expiryTime: 1 });
ControlNumberSchema.index({ source: 1, createdAt: -1 });

module.exports =
  mongoose.models.ControlNumber ||
  mongoose.model("ControlNumber", ControlNumberSchema);
