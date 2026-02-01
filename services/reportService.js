 const Loan = require("../models/Loan");
const Payment = require("../models/payment");
const Revenue = require("../models/Revenue");
const User = require("../models/User");
const Agent = require("../models/Agent");

class ReportService {

  // ======================================================
  // 1️⃣ DAILY SUMMARY
  // ======================================================
  async dailyReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const loans = await Loan.countDocuments({ createdAt: { $gte: today } });
    const payments = await Payment.countDocuments({ createdAt: { $gte: today } });

    const revenueAgg = await Revenue.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalFee" } } },
    ]);

    return {
      loans,
      payments,
      revenue: revenueAgg[0]?.total || 0,
    };
  }

  // ======================================================
  // 2️⃣ MONTHLY SUMMARY
  // ======================================================
  async monthlyReport() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const loans = await Loan.countDocuments({
      createdAt: { $gte: start, $lte: end },
    });

    const revenueAgg = await Revenue.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: "$totalFee" } } },
    ]);

    return {
      month: now.getMonth() + 1,
      loans,
      revenue: revenueAgg[0]?.total || 0,
    };
  }

  // ======================================================
  // 3️⃣ CUSTOMER DEBT REPORT
  // ======================================================
  async customerDebtReport(customerId) {
    return await Loan.find({
      customer: customerId,
      status: { $in: ["active", "overdue"] },
    }).populate("agent");
  }

  // ======================================================
  // 4️⃣ REVENUE BY DATE RANGE
  // ======================================================
  async revenueByDateRange(from, to) {
    return await Revenue.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(from),
            $lte: new Date(to),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalFee" },
          transactions: { $sum: 1 },
        },
      },
    ]);
  }

  // ======================================================
  // 5️⃣ REVENUE BY AGENT
  // ======================================================
  async revenueByAgent(from, to) {
    return await Revenue.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(from),
            $lte: new Date(to),
          },
        },
      },
      {
        $group: {
          _id: "$agent",
          totalRevenue: { $sum: "$totalFee" },
          transactions: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "agents",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      { $unwind: "$agent" },
      { $sort: { totalRevenue: -1 } },
    ]);
  }

  // ======================================================
  // 6️⃣ TOP AGENTS BY REVENUE
  // ======================================================
  async topAgents(limit = 5) {
    return await Revenue.aggregate([
      {
        $group: {
          _id: "$agent",
          totalRevenue: { $sum: "$totalFee" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "agents",
          localField: "_id",
          foreignField: "_id",
          as: "agent",
        },
      },
      { $unwind: "$agent" },
    ]);
  }

  // ======================================================
  // 7️⃣ LOAN RISK REPORT
  // ======================================================
  async loanRiskReport() {
    const overdue = await Loan.countDocuments({ status: "overdue" });
    const defaulted = await Loan.countDocuments({ status: "defaulted" });
    const active = await Loan.countDocuments({ status: "approved" });

    return {
      active,
      overdue,
      defaulted,
      riskRate:
        active > 0
          ? Number(((overdue + defaulted) / active).toFixed(2))
          : 0,
    };
  }

  // ======================================================
  // 8️⃣ LOAN PERFORMANCE STATS
  // ======================================================
  async loanPerformance() {
    const approved = await Loan.countDocuments({ status: "approved" });
    const rejected = await Loan.countDocuments({ status: "rejected" });
    const forceClosed = await Loan.countDocuments({ status: "force_closed" });

    return {
      approved,
      rejected,
      forceClosed,
      approvalRate:
        approved + rejected > 0
          ? Number((approved / (approved + rejected)).toFixed(2))
          : 0,
    };
  }

  // ======================================================
  // 9️⃣ USER STATISTICS
  // ======================================================
  async userStats() {
    const customers = await User.countDocuments({ role: "customer" });
    const agents = await User.countDocuments({ role: "agent" });
    const admins = await User.countDocuments({ role: "admin" });
    const blocked = await User.countDocuments({ isBlocked: true });

    return {
      customers,
      agents,
      admins,
      blocked,
    };
  }

  // ======================================================
  // 🔟 DAILY FEE REVENUE
  // ======================================================
  async dailyFeeRevenue() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const result = await Revenue.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$totalFee" },
          transactions: { $sum: 1 },
        },
      },
    ]);

    return {
      period: "daily",
      totalFees: result[0]?.totalFees || 0,
      transactions: result[0]?.transactions || 0,
    };
  }

  // ======================================================
  // 1️⃣1️⃣ WEEKLY FEE REVENUE
  // ======================================================
  async weeklyFeeRevenue() {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    const result = await Revenue.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$totalFee" },
          transactions: { $sum: 1 },
        },
      },
    ]);

    return {
      period: "weekly",
      totalFees: result[0]?.totalFees || 0,
      transactions: result[0]?.transactions || 0,
    };
  }

    // ======================================================
  // 🆕 1️⃣3️⃣ SAFE REPORT ACCESS AUDIT (OPTIONAL)
  // ======================================================
  async logReportAccess({
    report,
    user = null,
    meta = {},
  }) {
    try {
      await require("../models/AuditLog").create({
        action: "ADMIN_VIEW_REPORT",
        user,
        meta: {
          report,
          ...meta,
        },
      });
    } catch (e) {
      // ⚠️ Report must NEVER fail because of audit
      console.error("Report audit failed:", e.message);
    }
  }

  // ======================================================
  // 1️⃣2️⃣ MONTHLY FEE REVENUE
  // ======================================================
  async monthlyFeeRevenue() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const result = await Revenue.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: null,
          totalFees: { $sum: "$totalFee" },
          transactions: { $sum: 1 },
        },
      },
    ]);

    return {
      period: "monthly",
      month: now.getMonth() + 1,
      totalFees: result[0]?.totalFees || 0,
      transactions: result[0]?.transactions || 0,
    };
  }
}

module.exports = new ReportService();
