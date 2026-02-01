 // backend/models/RiskAssessment.js

const mongoose = require("mongoose");

const RiskAssessmentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: false, // risk can be done before loan exists
    },

    amount: { type: Number, required: true },

    /**
     * AI PREDICTION RESULTS
     */
    riskScore: { type: Number, required: true }, // numeric: 0–100
    riskBand: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },

    /**
     * AI CREDIT DECISION (rules-based)
     */
    decision: {
      type: String,
      enum: ["APPROVE", "REJECT", "REVIEW"],
      required: true,
    },

    decisionReasons: {
      type: [String],
      default: [],
    },

    /**
     * FRAUD ENGINE RESULTS
     */
    fraudScore: { type: Number, default: 0 },
    fraudLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
    fraudSignals: {
      type: [String],
      default: [],
    },

    /**
     * FEATURES USED BY AI FOR TRANSPARENCY
     */
    featuresUsed: {
      type: Object,
      default: {},
    },

    /**
     * PREDICTOR REASONS / AI EXPLAINABILITY
     */
    riskReasons: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RiskAssessment", RiskAssessmentSchema);
