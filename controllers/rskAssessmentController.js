// controllers/riskAssessmentController.js

const riskAssessmentService = require("../services/riskAssessmentService");

class RiskAssessmentController {
  
  /**
   * ======================================================
   * 1️⃣ Run AI Risk Assessment
   * ======================================================
   */
  async evaluateRisk(req, res) {
    try {
      const { customerId, agentId, amount, incomeEstimate, loanId } = req.body;

      if (!customerId || !agentId || !amount) {
        return res.status(400).json({
          success: false,
          message: "customerId, agentId na amount ni lazima"
        });
      }

      const result = await riskAssessmentService.evaluate({
        customerId,
        agentId,
        amount,
        incomeEstimate: incomeEstimate || 0,
        loanId: loanId || null
      });

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error("❌ Risk Evaluation Error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Risk evaluation failed"
      });
    }
  }

  /**
   * ======================================================
   * 2️⃣ Get all risk assessments for a specific customer
   * ======================================================
   */
  async getCustomerRiskHistory(req, res) {
    try {
      const { customerId } = req.params;

      const history = await riskAssessmentService.getCustomerRiskHistory(customerId);

      return res.status(200).json({
        success: true,
        total: history.length,
        data: history
      });

    } catch (error) {
      console.error("❌ Customer Risk History Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch customer risk history"
      });
    }
  }

  /**
   * ======================================================
   * 3️⃣ Get latest risk assessment for a loan
   * ======================================================
   */
  async getLoanLatestRisk(req, res) {
    try {
      const { loanId } = req.params;

      const assessment = await riskAssessmentService.getLatestForLoan(loanId);

      return res.status(200).json({
        success: true,
        data: assessment
      });

    } catch (error) {
      console.error("❌ Loan Risk Fetch Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch loan risk assessment"
      });
    }
  }
}

module.exports = new RiskAssessmentController();
