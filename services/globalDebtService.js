 // services/globalDebtService.js

const Loan = require("../models/Loan");
const Payment = require("../models/payment");
const CreditHistory = require("../models/creditHistory");

class GlobalDebtService {
  /**
   * ======================================================
   * 1️⃣ MAIN: Get full debt profile for a customer
   * (HAIJAGUSWA)
   * ======================================================
   */
  async getUserDebtSummary(userId) {
    const loans = await Loan.find({ customer: userId });

    if (loans.length === 0) {
      return {
        totalDebt: 0,
        activeLoans: 0,
        overdueLoans: 0,
        defaultedLoans: 0,
        fullyPaidLoans: 0,
        penaltiesTotal: 0,
        totalLoansTaken: 0,
        riskSignals: [],
        loanBreakdown: [],
      };
    }

    let totalDebt = 0;
    let activeLoans = 0;
    let overdueLoans = 0;
    let defaultedLoans = 0;
    let fullyPaidLoans = 0;
    let penaltiesTotal = 0;

    const loanBreakdown = [];

    for (let loan of loans) {
      const isOverdue = loan.status === "overdue";
      const isDefaulted = loan.status === "defaulted";
      const isActive = loan.status === "active";
      const isPaid = loan.status === "paid";

      totalDebt += loan.balance;
     penaltiesTotal += Number(loan.penalties || 0);


      if (isActive) activeLoans++;
      if (isOverdue) overdueLoans++;
      if (isDefaulted) defaultedLoans++;
      if (isPaid) fullyPaidLoans++;

      loanBreakdown.push({
        loanId: loan._id,
        status: loan.status,
        principal: loan.amount,
        balance: loan.balance,
        penalties: loan.penalties || 0,
        createdAt: loan.createdAt,
        dueDate: loan.dueDate,
      });
    }

    const totalLoansTaken = loans.length;

    const riskSignals = [];

    if (activeLoans > 2) riskSignals.push("Too many active loans");
    if (overdueLoans > 0) riskSignals.push("Has overdue loans");
    if (defaultedLoans > 0) riskSignals.push("Has defaulted loans");
    if (totalDebt > 300000) riskSignals.push("High total debt exposure");
    if (penaltiesTotal > 0) riskSignals.push("Accumulated penalties");

    return {
      totalDebt,
      activeLoans,
      overdueLoans,
      defaultedLoans,
      fullyPaidLoans,
      penaltiesTotal,
      totalLoansTaken,
      riskSignals,
      loanBreakdown,
    };
  }

  /**
   * ======================================================
   * 2️⃣ Agent limited view (HAIJAGUSWA)
   * ======================================================
   */
  async getAgentView(userId) {
    const summary = await this.getUserDebtSummary(userId);

    return {
      totalDebt: summary.totalDebt,
      activeLoans: summary.activeLoans,
      overdueLoans: summary.overdueLoans,
      defaultedLoans: summary.defaultedLoans,
    };
  }

  /**
   * ======================================================
   * 3️⃣ Repayment behavior score (HAIJAGUSWA)
   * ======================================================
   */
  async getRepaymentBehaviorScore(userId) {
    const history = await CreditHistory.find({ user: userId });

    if (history.length === 0) return 50;

    const repayments = history.filter(h => h.eventType === "PAYMENT_RECEIVED");
    const overdueEvents = history.filter(h => h.eventType === "OVERDUE");
    const defaults = history.filter(h => h.eventType === "DEFAULTED");

    let score = 100;

    if (overdueEvents.length > 0) score -= overdueEvents.length * 10;
    if (defaults.length > 0) score -= defaults.length * 25;
    if (repayments.length > 5) score += 10;

    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return score;
  }

  /**
   * ======================================================
   * ⭐ 4️⃣ NEW: Get customer debts grouped by CATEGORY
   * (HAIATHIRI CHOCHOTE)
   * ======================================================
   */
  async getCustomerDebtsGroupedByCategory(customerId) {
    const loans = await Loan.find({
      customer: customerId,
      status: { $in: ["approved", "active", "overdue", "defaulted"] },
    })
      .populate("agent", "businessName")
      .populate("agentCategory", "name");

    const grouped = {};

    for (const loan of loans) {
      const categoryId = loan.agentCategory?._id?.toString();
      if (!categoryId) continue;

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryId,
          categoryName: loan.agentCategory.name,
          totalDebt: 0,
          loans: [],
        };
      }

      const balance = loan.balance;

      grouped[categoryId].totalDebt += balance;

      grouped[categoryId].loans.push({
        loanId: loan._id,
        agentName: loan.agent?.businessName || "Unknown",
        totalPayable: loan.totalPayable,
        amountPaid: loan.amountPaid,
        balance,
        status: loan.status,
        dueDate: loan.dueDate,
      });
    }

    return Object.values(grouped);
  }

  /**
   * ======================================================
   * ⭐ 5️⃣ NEW: Get customer debts for a SPECIFIC category
   * (for LoanReviewScreen)
   * ======================================================
   */
  async getCustomerDebtsForCategory(customerId, categoryId) {
    const loans = await Loan.find({
      customer: customerId,
      agentCategory: categoryId,
      status: { $in: ["approved", "active", "overdue", "defaulted"] },
    })
      .populate("agent", "businessName");

    let totalDebt = 0;

    const debts = loans.map((loan) => {
      const balance = loan.balance;
      totalDebt += balance;

      return {
        loanId: loan._id,
        agentName: loan.agent?.businessName || "Unknown",
        totalPayable: loan.totalPayable,
        amountPaid: loan.amountPaid,
        balance,
        status: loan.status,
        dueDate: loan.dueDate,
      };
    });

    return {
      categoryId,
      totalDebt,
      count: debts.length,
      debts,
    };
  }
}

module.exports = new GlobalDebtService();
