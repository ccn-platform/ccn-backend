 // services/riskAssessmentService.js

const RiskAssessment = require("../models/riskAssessment");
const Loan = require("../models/Loan");

// Business services
const globalDebtService = require("./globalDebtService");

// AI engines
const riskScoringEngine = require("../ai/credit/riskScoringEngine");
const fraudDetector = require("../ai/fraud/fraudDetector");

// Optional: logger (ukitaka kutumia baadaye)
const logger = require("../utils/logger");

// 🆕 ADD ONLY: Credit History Hook (SAFE)
const creditHistoryService = require("./creditHistoryService");

class RiskAssessmentService {
  /**
   * ======================================================
   * 1️⃣ MAIN: Evaluate risk for a loan request
   * ======================================================
   */
  async evaluate({ customerId, agentId, amount, incomeEstimate = 0, loanId = null }) {
    const debtSummary = await globalDebtService.getUserDebtSummary(customerId);
    const behaviorScore = await globalDebtService.getRepaymentBehaviorScore(customerId);

    const creditResult = await riskScoringEngine.evaluate(
      customerId,
      agentId,
      amount,
      incomeEstimate
    );

    const riskScore = Math.round((creditResult.score || 0) * 100);

    const fraudResult = await fraudDetector.evaluate(customerId, agentId);
    const fraudScore = fraudResult.overallRisk || 0;

    let fraudLevel = "LOW";
    if (fraudScore >= 0.8) fraudLevel = "HIGH";
    else if (fraudScore >= 0.5) fraudLevel = "MEDIUM";

    const fraudSignals = [
      ...(fraudResult.customer?.signals || []),
      ...(fraudResult.agent?.signals || [])
    ];

    const featuresUsed = {
      debtSummary,
      behaviorScore,
      requestedAmount: amount,
      incomeEstimate
    };

    const assessment = await RiskAssessment.create({
      customer: customerId,
      agent: agentId,
      loan: loanId || undefined,
      amount,

      riskScore,
      riskBand: creditResult.band || "LOW",

      decision: creditResult.decision || "REVIEW",
      decisionReasons: creditResult.decisionReasons || [],

      fraudScore,
      fraudLevel,
      fraudSignals,

      featuresUsed,
      riskReasons: creditResult.reasons || []
    });

    // 🆕 ADD ONLY — RISK SCORE → CREDIT HISTORY (SAFE)
    await creditHistoryService.registerRiskUpdate({
      user: customerId,
      loan: loanId,
      scoreBefore: null,
      scoreAfter: riskScore,
    });

    if (logger && logger.info) {
      logger.info("Risk assessment completed", {
        customerId,
        agentId,
        amount,
        riskScore,
        band: creditResult.band,
        decision: creditResult.decision,
        fraudLevel
      });
    }

    return {
      message: "Risk assessment completed",
      riskScore,
      riskBand: creditResult.band || "LOW",
      decision: creditResult.decision || "REVIEW",
      decisionReasons: creditResult.decisionReasons || [],
      fraud: {
        score: fraudScore,
        level: fraudLevel,
        signals: fraudSignals,
      },
      debtSummary,
      behaviorScore,
      assessmentId: assessment._id
    };
  }

  async getCustomerRiskHistory(customerId) {
    return RiskAssessment.find({ customer: customerId })
      .sort({ createdAt: -1 })
      .populate("loan")
      .populate("agent", "name");
  }

  async getLatestForLoan(loanId) {
    return RiskAssessment.findOne({ loan: loanId })
      .sort({ createdAt: -1 });
  }
}

module.exports = new RiskAssessmentService();
