  const mongoose = require("mongoose");

const AgentFeeSchema = new mongoose.Schema(
  {
     agent: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Agent",
  required: true,
  unique: true,
  index: true,
},

    startDate: { type: Date, default: null, index: true },

 endDate: {
  type: Date,
  default: null,
  index: true,
  validate: {
    validator: function (value) {
      if (!value || !this.startDate) return true;
      return value >= this.startDate;
    },
    message: "endDate must be greater than startDate"
  }
},
    status: {
      type: String,
      enum: ["inactive", "active", "expired"],
      default: "inactive",
       required: true,
      index: true,
    },

   
    // ✅ FIXED
   plan: {
  type: String,
  enum: [
    "FREE_TRIAL",
    "WEEKLY",
    "MONTHLY",
    "SEMI_ANNUAL",
    "ANNUAL",
  ],
  default: "FREE_TRIAL",
  index: true,
},

    amountPaid: {
      type: Number,
       default: 0,
      min: 0
    },

    lastPaymentRef: { type: String, default: null },

    lastControlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
      default: null,
    },

    renewalCount: {
  type: Number,
  default: 0,
  min: 0
},

    notes: { type: String, default: null },

    activatedAt: {
  type: Date,
  default: Date.now,
  index: true,
},

    source: {
      type: String,
      enum: ["SYSTEM", "PAYMENT", "ADMIN"],
      default: "SYSTEM",
      index: true,
    },
  },
  { timestamps: true }
);
AgentFeeSchema.index({ activatedAt: 1, status: 1 });
AgentFeeSchema.index({ agent: 1, status: 1 });
AgentFeeSchema.index({ agent: 1, endDate: 1 });
AgentFeeSchema.index({ plan: 1, status: 1 });
AgentFeeSchema.index({ status: 1, endDate: 1 });
module.exports =
  mongoose.models.AgentFee ||
  mongoose.model("AgentFee", AgentFeeSchema);
