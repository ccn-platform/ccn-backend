   const Agent = require("../models/Agent");
const Loan = require("../models/Loan");
const AgentSubscription = require("../models/agentFee");
const BusinessCategory = require("../models/businessCategory");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const idGenerator = require("../utils/idGenerator");
const normalizePhone = require("../utils/normalizePhone");
const dayjs = require("dayjs");

/**
 * ======================================================
 * ⭐ SAFE INTERNAL HELPER
 * ======================================================
 */
async function resolveAgentId(agentOrUserId) {
  const agent = await Agent.findById(agentOrUserId);
  if (agent) return agent._id;

  const agentByUser = await Agent.findOne({ user: agentOrUserId });
  if (agentByUser) return agentByUser._id;

  throw new Error("Agent haijapatikana kwa user huyu.");
}

class AgentService {
  /* ======================================================
   * A. AGENT REGISTRATION & ACCOUNT
   * ====================================================== */
  // ⚠️ HAKUNA KILICHOBADILISHWA HAPA
  // ------------------------------------------------------

  /* ======================================================
   * ⭐ SAFE — GET CUSTOMER DEBTS FOR AGENT CATEGORY
   * (USED BY LoanService — DO NOT REMOVE)
   * ====================================================== */
  async getCustomerDebtsForAgentCategory(customerId, categoryId) {
  const loans = await Loan.find({
    customer: customerId,
    agentCategory: categoryId,
    status: { $in: ["active", "overdue", "defaulted"] },
  }).select(
    "status principalRemaining feesRemaining penaltiesRemaining createdAt agentSnapshot"
  );

  let totalDebt = 0;

  const debts = loans
    .map((loan) => {
      const balance =
        (loan.principalRemaining || 0) +
        (loan.feesRemaining || 0) +
        (loan.penaltiesRemaining || 0);

      if (balance <= 0) return null;

      totalDebt += balance;

      return {
        loanId: loan._id,
        agentName:
          loan.agentSnapshot?.businessName ||
          loan.agentSnapshot?.fullName ||
          "Wakala",
        status: loan.status,
        balance,
        createdAt: loan.createdAt,
      };
    })
    .filter(Boolean);

  return {
    count: debts.length,
    totalDebt,
    debts,
    summary: {
      totalLoans: debts.length,
      totalOutstanding: totalDebt,
    },
  };
}


  /* ======================================================
   * ⭐ DASHBOARD: RECENT ACTIVITY
   * ====================================================== */
  async getAgentRecentActivity(agentOrUserId, limit = 5) {
    const agentId = await resolveAgentId(agentOrUserId);

    const loans = await Loan.find({ agent: agentId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return loans.map((loan) => ({
      type: "LOAN_CREATED",
      amount: loan.amount ?? loan.itemsTotal ?? 0,
      status: loan.status,
      date: loan.createdAt,
    }));
  }
}

module.exports = new AgentService();
