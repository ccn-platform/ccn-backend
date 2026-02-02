 // controllers/revenueController.js

const revenueService = require("../services/revenueService");

class RevenueController {
  /**
   * ======================================================
   * 1️⃣ Record Loan Revenue (Admin or internal call only)
   * ======================================================
   */
  async recordLoanRevenue(req, res) {
    try {
      const { loanId, amount } = req.body;

      if (!loanId || !amount) {
        return res.status(400).json({
          success: false,
          message: "loanId na amount zinahitajika."
        });
      }

      const data = await revenueService.recordLoanRevenue(loanId, amount);

      return res.status(201).json({
        success: true,
        message: "Loan revenue recorded",
        data
      });
    } catch (error) {
      console.error("❌ Loan Revenue Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to record loan revenue"
      });
    }
  }

  /**
   * ======================================================
   * 2️⃣ Record Payment Revenue
   * ======================================================
   */
  async recordPaymentRevenue(req, res) {
    try {
      const { controlNumber, amount } = req.body;

      if (!controlNumber || !amount) {
        return res.status(400).json({
          success: false,
          message: "controlNumber na amount zinahitajika."
        });
      }

      const data = await revenueService.recordPaymentRevenue(
        controlNumber,
        amount
      );

      return res.status(201).json({
        success: true,
        message: "Payment revenue recorded",
        data
      });
    } catch (error) {
      console.error("❌ Payment Revenue Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to record payment revenue"
      });
    }
  }

  /**
   * ======================================================
   * 3️⃣ Get Total Revenue (Admin dashboard)
   * ======================================================
   */
  async getTotalRevenue(req, res) {
    try {
      const total = await revenueService.getTotalRevenue();

      return res.status(200).json({
        success: true,
        message: "Total revenue fetched",
        totalRevenue: total
      });
    } catch (error) {
      console.error("❌ Total Revenue Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch total revenue"
      });
    }
  }

  /**
   * ======================================================
   * 4️⃣ Revenue Report within date range
   * ======================================================
   */
  async getRevenueReport(req, res) {
    try {
      const { start, end } = req.query;

      if (!start || !end) {
        return res.status(400).json({
          success: false,
          message: "start na end dates zinahitajika."
        });
      }

      const data = await revenueService.getRevenueReport({
        start: new Date(start),
        end: new Date(end)
      });

      return res.status(200).json({
        success: true,
        message: "Revenue report fetched",
        data
      });
    } catch (error) {
      console.error("❌ Revenue Report Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch revenue report"
      });
    }
  }
}

module.exports = new RevenueController();
