 const ReportService = require("../services/reportService");

class ReportController {

  // ===============================
  // DASHBOARD REPORTS
  // ===============================

  async dailyReport(req, res) {
    try {
      const data = await ReportService.dailyReport();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
async dailyReport(req, res) {
  try {
    const data = await ReportService.dailyReport();

    // 🆕 SAFE AUDIT (ADD-ONLY)
    if (ReportService.logReportAccess) {
      ReportService.logReportAccess({
        report: "DAILY_REPORT",
        user: req.user?._id,
      });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}


  async monthlyReport(req, res) {
    try {
      const data = await ReportService.monthlyReport();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ===============================
  // CUSTOMER / USER REPORTS
  // ===============================

  async customerDebtReport(req, res) {
    try {
      const { customerId } = req.params;
      const data = await ReportService.customerDebtReport(customerId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async userStats(req, res) {
    try {
      const data = await ReportService.userStats();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ===============================
  // REVENUE REPORTS
  // ===============================

  async revenueByDateRange(req, res) {
    try {
      const { from, to } = req.query;
      const data = await ReportService.revenueByDateRange(from, to);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async revenueByAgent(req, res) {
    try {
      const { from, to } = req.query;
      const data = await ReportService.revenueByAgent(from, to);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async topAgents(req, res) {
    try {
      const limit = Number(req.query.limit) || 5;
      const data = await ReportService.topAgents(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ===============================
  // LOAN ANALYTICS
  // ===============================

  async loanRiskReport(req, res) {
    try {
      const data = await ReportService.loanRiskReport();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async loanPerformance(req, res) {
    try {
      const data = await ReportService.loanPerformance();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ===============================
  // FEE REVENUE (ADA)
  // ===============================

  async dailyFeeRevenue(req, res) {
    try {
      const data = await ReportService.dailyFeeRevenue();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async weeklyFeeRevenue(req, res) {
    try {
      const data = await ReportService.weeklyFeeRevenue();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async monthlyFeeRevenue(req, res) {
    try {
      const data = await ReportService.monthlyFeeRevenue();
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new ReportController();
