  const mongoose = require("mongoose");

const RevenueSchema = new mongoose.Schema(
  {
    // ===============================
    // RELATIONS
    // ===============================
    loan: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    agent: { type: mongoose.Schema.Types.ObjectId, ref: "Agent" },

    // ===============================
    // EXISTING FEES (UNCHANGED)
    // ===============================
    applicationFee: { type: Number, default: 0 },
    approvalFee: { type: Number, default: 0 },

    // ===============================
    // 🆕 PAYMENT VALUES
    // ===============================
    paymentFee: { type: Number, default: 0 },
    penalties: { type: Number, default: 0 },

    // ===============================
    // 🆕 TOTAL AMOUNT
    // ===============================
    totalFee: { type: Number, required: true },

    // ===============================
    // 🆕 SOURCE (EXPANDED — SAFE)
    // ===============================
    source: {
      type: String,
      enum: [
         
        "payment_charge", // existing
        "LOAN_FEE",       // ✅ new (your current usage)
        "PAYMENT",        // optional future
      ],
      required: true,
      index: true,
    },

    // ===============================
    // 🆕 AUDIT FIELDS
    // ===============================
    controlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
    },

    transactionId: {
      type: String,
      index: true,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Indexes
RevenueSchema.index({ createdAt: -1 });
RevenueSchema.index({ source: 1 });

module.exports = mongoose.model("Revenue", RevenueSchema);
