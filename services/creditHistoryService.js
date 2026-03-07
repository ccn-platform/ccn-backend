  // services/creditHistoryService.js

const CreditHistory = require("../models/creditHistory");
const Loan = require("../models/Loan");
 
const globalDebtService = require("./globalDebtService");
const auditLogsService = require("./auditLogsService");

class CreditHistoryService {

  /**
   * =========================================================
   * 1️⃣ CORE — Create credit event
   * =========================================================
   */
  async recordEvent({
    user,
    loan,
    amount = 0,
    eventType,
    balanceBefore,
    balanceAfter,
    lateDays = 0,
    scoreBefore,
    scoreAfter,
    description = "",
  }) {

     await CreditHistory.updateOne(
  { customer: user }, // 🔑 record moja tu kwa customer
  {
    $set: {
      lastLoan: loan,
      lastUpdatedAt: new Date(),
    },

    // ongeza hesabu kulingana na tukio
    $inc:
      eventType === "LOAN_CREATED"
        ? { totalLoans: 1 }
        : eventType === "OVERDUE"
        ? { latePayments: 1 }
        : eventType === "DEFAULTED"
        ? { defaults: 1 }
        : {},
  },
  { upsert: true, setDefaultsOnInsert: true }
);

 await auditLogsService.log({
  action: "CREDIT_HISTORY_EVENT",

  actor: user,
  actorRole: "customer",

  targetType: "Loan",
  targetId: loan,

  loan,
  customer: user,

  meta: {
    eventType,
    amount,
    balanceBefore,
    balanceAfter,
    lateDays,
    scoreBefore,
    scoreAfter,
    description,
  },

  source: "SYSTEM",
});

    return true;
  }

  /**
   * =========================================================
   * 2️⃣ LOAN CREATED
   * =========================================================
   */
  async registerLoanCreated(loan) {
    return this.recordEvent({
      user: loan.customer,
      loan: loan._id,
      eventType: "LOAN_CREATED",
      balanceBefore: 0,
      balanceAfter: loan.totalPayable,
      description: "Loan issued to customer",
    });
  }

  /**
   * =========================================================
   * 3️⃣ PAYMENT RECEIVED
   * =========================================================
   */
  async registerRepayment({ user, loan, amount, paymentType }) {
     const loanDoc = await Loan.findById(loan).lean();
     if (!loanDoc) return;
    return this.recordEvent({
      user,
      loan,
      amount,
      eventType: "PAYMENT_RECEIVED",
      balanceBefore: loanDoc.totalPayable - (loanDoc.amountPaid - amount),
      balanceAfter: loanDoc.totalPayable - loanDoc.amountPaid,
      description: `Repayment of ${amount} (${paymentType})`,
    });
  }

  /**
   * =========================================================
   * 4️⃣ OVERDUE
   * =========================================================
   */
  async registerOverdue(loan, lateDays) {
     const loanDoc = await Loan.findById(loan).lean();
     if (!loanDoc) return;
    return this.recordEvent({
      user: loanDoc.customer,
      loan,
      eventType: "OVERDUE",
      lateDays,
      balanceBefore: loanDoc.totalPayable - loanDoc.amountPaid,
      balanceAfter: loanDoc.totalPayable - loanDoc.amountPaid,
      description: `Loan overdue for ${lateDays} days`,
    });
  }

  /**
   * =========================================================
   * 5️⃣ DEFAULTED
   * =========================================================
   */
  async registerDefault(loan) {
    const loanDoc = await Loan.findById(loan).lean();
    if (!loanDoc) return;
    return this.recordEvent({
      user: loanDoc.customer,
      loan,
      eventType: "DEFAULTED",
      balanceBefore: loanDoc.totalPayable - loanDoc.amountPaid,
      balanceAfter: loanDoc.totalPayable - loanDoc.amountPaid,
      description: "Loan moved to DEFAULT status",
    });
  }

  /**
   * =========================================================
   * 6️⃣ RISK SCORE UPDATE
   * =========================================================
   */
  async registerRiskUpdate({ user, loan, scoreBefore, scoreAfter }) {
    return this.recordEvent({
      user,
      loan,
      eventType: "RISK_UPDATED",
      scoreBefore,
      scoreAfter,
      description: "AI risk score updated",
    });
  }

  /**
   * =========================================================
   * 7️⃣ CUSTOMER HISTORY
   * =========================================================
   */
 async getCustomerHistory(customerId) {
  return CreditHistory.findOne({ customer: customerId })
    .populate("lastLoan")
    .lean();
}
  /**
   * =========================================================
   * 8️⃣ CUSTOMER SUMMARY (AI / Analytics)
   * =========================================================
   */
  async getSummaryForCustomer(customerId) {

   const history = await CreditHistory.findOne({ customer: customerId }).lean();
  const debt = await globalDebtService.getUserDebtSummary(customerId);

  if (!history) {
    return {
      totalLoans: 0,
      latePayments: 0,
      defaults: 0,
      riskBand: "LOW",
      currentDebt: debt.totalDebt,
    };
  }

  return {
    totalLoans: history.totalLoans,
    latePayments: history.latePayments,
    defaults: history.defaults,
    riskBand: history.riskBand,
    currentDebt: debt.totalDebt,
  };

}

    /**
   * =========================================================
   * 1️⃣4️⃣ HOOK — LOAN ADJUSTED (AGENT / ADMIN)
   * =========================================================
   */
  async onLoanAdjusted(
    { loanId, agentId, amount, breakdown, reason },
    session = null
  ) {
    const loan = await Loan.findById(loanId).lean();
    if (!loan) return;

    return this.recordEvent({
      user: loan.customer,
      loan: loanId,
      amount,
      eventType: "LOAN_ADJUSTED",
      balanceBefore:
        (loan.principalRemaining || 0) +
        (loan.feesRemaining || 0) +
        (loan.penaltiesRemaining || 0) +
        amount,
      balanceAfter:
        (loan.principalRemaining || 0) +
        (loan.feesRemaining || 0) +
        (loan.penaltiesRemaining || 0),
      description: `Loan adjusted by agent (${agentId}): ${reason}`,
    });
  }

  /**
   * =========================================================
   * 9️⃣ LOAN HISTORY
   * =========================================================
   */
  
 async getLoanHistory(loanId) {
  return CreditHistory.findOne({ lastLoan: loanId }).lean();
}
  // =========================================================
  // 🔽 🔽 🔽 SAFE HOOKS
  // =========================================================

  /**
   * 🔟 HOOK — Loan approved
   */
  async onLoanApproved(loan) {
    return this.registerLoanCreated(loan);
  }

  /**
   * 1️⃣1️⃣ HOOK — Payment applied
   */
  async onPaymentApplied({ loanId, amount, paymentType }) {

  const loanDoc = await Loan.findById(loanId).lean();
  if (!loanDoc) return;

  return this.registerRepayment({
    user: loanDoc.customer,
    loan: loanId,
    amount,
    paymentType,
  });

}

  /**
   * 1️⃣2️⃣ HOOK — Overdue automation
   */
  async onLoanOverdue({ loanId, lateDays }) {
    return this.registerOverdue(loanId, lateDays);
  }

  /**
   * 1️⃣3️⃣ HOOK — Default automation
   */
  async onLoanDefaulted(loanId) {
    return this.registerDefault(loanId);
  }
}
  
module.exports = new CreditHistoryService();
