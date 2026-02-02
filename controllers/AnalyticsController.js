 const analyticsService = require("../services/analyticsService");

class AnalyticsController {
  async getDailyMetrics(req, res) {
    try {
      const data = await analyticsService.getDailyMetrics();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Daily Metrics Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch daily metrics" });
    }
  }

  async getWeeklyGrowth(req, res) {
    try {
      const data = await analyticsService.getWeeklyGrowth();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Weekly Growth Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch weekly growth" });
    }
  }

  async getRevenueSummary(req, res) {
    try {
      const data = await analyticsService.getRevenueSummary();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Revenue Summary Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch revenue summary" });
    }
  }

  async getLoanPortfolio(req, res) {
    try {
      const data = await analyticsService.getLoanPortfolio();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Loan Portfolio Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch loan portfolio" });
    }
  }

  async getTopAgents(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await analyticsService.getTopAgents(limit);
      return res.status(200).json({ success: true, total: data.length, data });
    } catch (error) {
      console.error("❌ Top Agents Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch top agents" });
    }
  }

  async getSystemHealth(req, res) {
    try {
      const data = await analyticsService.getSystemHealth();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ System Health Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch system health" });
    }
  }

  // ======================================================
  // ➕➕➕ NEW ADMIN METRICS
  // ======================================================

  async getRepaymentRate(req, res) {
    try {
      const data = await analyticsService.getRepaymentRate();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Repayment Rate Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch repayment rate" });
    }
  }

  async getAverageLoanSize(req, res) {
    try {
      const data = await analyticsService.getAverageLoanSize();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Average Loan Size Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch average loan size" });
    }
  }

  async getAgentPerformance(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await analyticsService.getAgentPerformance(limit);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Agent Performance Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch agent performance" });
    }
  }

  async getCustomerRetention(req, res) {
    try {
      const data = await analyticsService.getCustomerRetention();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error("❌ Customer Retention Error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch customer retention" });
    }
  }
}

module.exports = new AnalyticsController();
