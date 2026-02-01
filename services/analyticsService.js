 // backend/services/analyticsService.js

const User = require("../models/User");
const Agent = require("../models/Agent");
const Loan = require("../models/Loan");
const Payment = require("../models/payment");
const Revenue = require("../models/Revenue");
const dayjs = require("dayjs");

class AnalyticsService {
  async getDailyMetrics() {
    const today = dayjs().startOf("day");
    const tomorrow = dayjs().endOf("day");

    const newUsers = await User.countDocuments({
      createdAt: { $gte: today, $lte: tomorrow },
      role: "customer",
    });

    const newAgents = await Agent.countDocuments({
      createdAt: { $gte: today, $lte: tomorrow },
    });

    const loansIssued = await Loan.countDocuments({
      createdAt: { $gte: today, $lte: tomorrow },
    });

    const paymentsReceived = await Payment.countDocuments({
      createdAt: { $gte: today, $lte: tomorrow },
    });

    return {
      date: today.format("YYYY-MM-DD"),
      newUsers,
      newAgents,
      loansIssued,
      paymentsReceived,
    };
  }

  async getWeeklyGrowth() {
    const results = [];

    for (let i = 6; i >= 0; i--) {
      const day = dayjs().subtract(i, "day");
      const start = day.startOf("day");
      const end = day.endOf("day");

      const users = await User.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const loans = await Loan.countDocuments({ createdAt: { $gte: start, $lte: end } });
      const payments = await Payment.countDocuments({ createdAt: { $gte: start, $lte: end } });

      results.push({
        date: day.format("DD MMM"),
        users,
        loans,
        payments,
      });
    }

    return results;
  }

  async getRevenueSummary() {
    const totalRevenue = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: "$totalFee" } } },
    ]);

    const monthlyRevenue = await Revenue.aggregate([
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          total: { $sum: "$totalFee" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return {
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue,
    };
  }

  async getLoanPortfolio() {
    const totalLoans = await Loan.countDocuments();

    const active = await Loan.countDocuments({ status: "active" });
    const overdue = await Loan.countDocuments({ status: "overdue" });
    const paid = await Loan.countDocuments({ status: "paid" });

    const portfolioValue = await Loan.aggregate([
      { $match: { status: { $in: ["active", "overdue"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    return {
      totalLoans,
      active,
      overdue,
      paid,
      portfolioValue: portfolioValue[0]?.total || 0,
    };
  }

  async getTopAgents(limit = 10) {
    const top = await Loan.aggregate([
      {
        $group: {
          _id: "$agent",
          totalLoans: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: limit },
    ]);

    for (const item of top) {
      item.agent = await Agent.findById(item._id).populate("businessCategory");
    }

    return top;
  }

  async getSystemHealth() {
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalAgents = await Agent.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: "active" });
    const overdueLoans = await Loan.countDocuments({ status: "overdue" });

    return {
      totalCustomers,
      totalAgents,
      activeLoans,
      overdueLoans,
    };
  }

  // ======================================================
  // ➕➕➕ NEW ADMIN METRICS (SAFE ADDITIONS)
  // ======================================================

  async getRepaymentRate() {
    const paid = await Loan.countDocuments({ status: "paid" });
    const overdue = await Loan.countDocuments({ status: { $in: ["overdue", "defaulted"] } });

    const totalClosed = paid + overdue;
    const rate = totalClosed === 0 ? 0 : Math.round((paid / totalClosed) * 100);

    return {
      paidLoans: paid,
      problemLoans: overdue,
      repaymentRate: rate,
    };
  }

  async getAverageLoanSize() {
    const avg = await Loan.aggregate([
      { $group: { _id: null, average: { $avg: "$amount" } } },
    ]);

    return {
      averageLoanAmount: Math.round(avg[0]?.average || 0),
    };
  }

  async getAgentPerformance(limit = 10) {
    return Loan.aggregate([
      {
        $group: {
          _id: "$agent",
          totalLoans: { $sum: 1 },
          paidLoans: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          overdueLoans: {
            $sum: { $cond: [{ $in: ["$status", ["overdue", "defaulted"]] }, 1, 0] },
          },
        },
      },
      { $sort: { paidLoans: -1 } },
      { $limit: limit },
    ]);
  }

  async getCustomerRetention() {
    const retention = await Loan.aggregate([
      { $group: { _id: "$customer", loans: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          repeatCustomers: {
            $sum: { $cond: [{ $gt: ["$loans", 1] }, 1, 0] },
          },
          oneTimeCustomers: {
            $sum: { $cond: [{ $eq: ["$loans", 1] }, 1, 0] },
          },
        },
      },
    ]);

    return retention[0] || { repeatCustomers: 0, oneTimeCustomers: 0 };
  }
}

module.exports = new AnalyticsService();
