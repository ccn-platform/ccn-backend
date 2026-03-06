  const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, default: 0 },
});

const loanSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🆕 ADD ONLY — anti double-adjust / race guard
   lastAdjustmentAt: {
      type: Date,
      default: null,
      index: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },

    agentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BusinessCategory",
    },

    agentPhone: {
      type: String,
    },

    agentPhoneNormalized: {
      type: String,
      index: true,
    },

    agentSnapshot: {
      agentId: { type: String },
      fullName: { type: String },
      phone: { type: String },
      businessName: { type: String },
      categoryName: { type: String },
    },

    customerSnapshot: {
      customerId: { type: String },
      fullName: { type: String },
      phone: { type: String },
      phoneNormalized: { type: String },
    },

    amount: { type: Number, required: true },

    items: [itemSchema],

    itemsTotal: { type: Number, default: 0 },

    repaymentPeriod: { type: Number, required: true },

    dueDate: { type: Date, required: true },

    // 🆕 ADD ONLY — when loan became operational (SAFE)
    activatedAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending_agent_review",
        "approved",
        "rejected",
        "active",
        "overdue",
        "defaulted",
        "paid",
      ],
      default: "pending_agent_review",
      index: true,
    },

    applicationFee: { type: Number, default: 0 },
    approvalFee: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 },

    totalPayable: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },

    // ======================================================
    // 🆕 ADD ONLY — BALANCE TRACKING (SAFE)
    // ======================================================
    principalRemaining: {
      type: Number,
      default: 0,
    },

    feesRemaining: {
      type: Number,
      default: 0,
    },

    penaltiesRemaining: {
      type: Number,
      default: 0,
    },
    isOverdue: {
  type: Boolean,
  default: false,
  index: true,
},

     overdueAt: {
      type: Date,
      default: null,
    },

    // 🆕 ADD ONLY — fully paid timestamp (SAFE)
    paidAt: {
      type: Date,
      default: null,
    },

    controlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
    },

     reference: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);
 
 /**
 * ======================================================
 * 🔐 CAPTURE PREVIOUS STATUS (PRE HOOK)
 * ======================================================
 */
loanSchema.pre("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery()).lean();
  if (doc) {
    this._previousStatus = doc.status;
  }
});

/**
 * ======================================================
 * 🧾 AUDIT STATUS CHANGE (POST HOOK)
 * ======================================================
 */
 
 
// ⭐ INDEXES (UNCHANGED)
loanSchema.index({ customer: 1 });
loanSchema.index({ agent: 1 });
loanSchema.index({ createdAt: -1 });

// 🆕 ADD ONLY — helps overdue & automation queries
 loanSchema.index({ status: 1, dueDate: 1, isOverdue: 1 });
// 🆕 ADD ONLY — fast agent queries (millions scale)
loanSchema.index({ agent: 1, status: 1 });
loanSchema.index({ customer: 1, status: 1, isOverdue: 1 });
loanSchema.index({ controlNumber: 1 });
loanSchema.index({ customer: 1, createdAt: -1 });
loanSchema.index({ agent: 1, createdAt: -1 });
loanSchema.index({ status: 1, createdAt: -1 });
loanSchema.index({ agent: 1, status: 1, createdAt: -1 });
LoanSchema.index({ customer: 1, status: 1 });

module.exports = mongoose.model("Loan", loanSchema);
