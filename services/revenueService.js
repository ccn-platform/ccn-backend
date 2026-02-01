 const Revenue = require("../models/Revenue");
const Loan = require("../models/Loan");

class RevenueService {

  /**
   * ======================================================
   * 1️⃣ RECORD LOAN REVENUE (APPLICATION + APPROVAL FEES)
   * ======================================================
   * Called when loan is APPROVED
   * Reads fees directly from Loan (single source of truth)
   */
  async recordLoanRevenue(loanId) {
    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan haipo.");

    // Hakikisha kuna fee yoyote ya kurekodi
    if ((loan.totalFee || 0) <= 0) return null;

    // 🆕 ADD ONLY — prevent duplicate loan revenue
    const exists = await Revenue.findOne({
      loan: loan._id,
      source: "loan_fee",
    });

    if (exists) return exists;

    return await Revenue.create({
      loan: loan._id,
      customer: loan.customer,
      agent: loan.agent,

      applicationFee: loan.applicationFee || 0,
      approvalFee: loan.approvalFee || 0,
      totalFee: loan.totalFee || 0,

      source: "loan_fee",

      // 🆕 ADD ONLY
      status: "pending",
      recordedAt: new Date(),
    });
  }

  /**
   * ======================================================
   * 2️⃣ RECORD PAYMENT REVENUE (FEES + PENALTIES)
   * ======================================================
   * Called from PaymentService
   */
  async recordPaymentRevenue({
    loanId,
    customerId,
    agentId,
    fees = 0,
    penalties = 0,
    controlNumber = null,
    transactionId = null,
  }) {
    const total = fees + penalties;
    if (total <= 0) return null;

    // 🆕 ADD ONLY — prevent duplicate payment revenue
    if (transactionId) {
      const exists = await Revenue.findOne({
        transactionId,
        source: "payment_charge",
      });

      if (exists) return exists;
    }

    return await Revenue.create({
      loan: loanId,
      customer: customerId,
      agent: agentId,

      paymentFee: fees,
      penalties,
      totalFee: total,

      controlNumber,
      transactionId,

      source: "payment_charge",

      // 🆕 ADD ONLY
      status: "pending",
      recordedAt: new Date(),
    });
  }

  /**
   * ======================================================
   * 3️⃣ GET TOTAL SYSTEM REVENUE (ALL SOURCES)
   * ======================================================
   */
  async getTotalRevenue() {
    const data = await Revenue.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalFee" },
        },
      },
    ]);

    return data[0]?.total || 0;
  }

  /**
   * ======================================================
   * 4️⃣ GET TOTAL REVENUE BY STATUS
   * ======================================================
   * Useful for CCN settlement & accounting
   */
  async getTotalRevenueByStatus(status = "pending") {
    const data = await Revenue.aggregate([
      {
        $match: { status },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalFee" },
        },
      },
    ]);

    return data[0]?.total || 0;
  }

  /**
   * ======================================================
   * 5️⃣ MARK REVENUE AS SETTLED (CCN PAY-IN CONFIRMED)
   * ======================================================
   * Called by settlement service / cron
   */
  async markRevenueAsSettled(revenueIds = []) {
    if (!Array.isArray(revenueIds) || revenueIds.length === 0) return;

    await Revenue.updateMany(
      { _id: { $in: revenueIds } },
      {
        $set: {
          status: "settled",
          settledAt: new Date(),
        },
      }
    );
  }

  /**
   * ======================================================
   * 6️⃣ REVENUE REPORT (BY PERIOD + OPTIONAL SOURCE)
   * ======================================================
   */
  async getRevenueReport({ start, end, source = null, status = null }) {
    const query = {
      createdAt: { $gte: start, $lte: end },
    };

    if (source) query.source = source;
    if (status) query.status = status;

    return await Revenue.find(query).sort({ createdAt: -1 });
  }
}

module.exports = new RevenueService();
