// services/agentPayoutService.js

const AgentPayout = require("../models/AgentPayout");
const Agent = require("../models/Agent");
const Loan = require("../models/Loan");
const Payment = require("../models/payment");

class AgentPayoutService {
  /**
   * ======================================================
   * CREATE AGENT PAYOUT AFTER PAYMENT
   * ======================================================
   * - Called AFTER payment is completed
   * - Agent gets PRINCIPAL only
   * - Uses Agent.primaryPayoutAccount (snapshot)
   * - SAFE: no breaking changes
   */
  async createFromPayment({ paymentId }) {
    // 1️⃣ Fetch payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error("Payment haijapatikana");
    }

    // 2️⃣ Fetch loan
    const loan = await Loan.findById(payment.loan);
    if (!loan) {
      throw new Error("Loan haijapatikana kwa payment hii");
    }

    // 3️⃣ Fetch agent
    const agent = await Agent.findById(loan.agent);
    if (!agent) {
      throw new Error("Agent wa mkopo hajapatikana");
    }

    // 4️⃣ Hakikisha agent ana payout account
    if (!agent.primaryPayoutAccount) {
      throw new Error(
        "Agent hana payout account ya msingi (primary)"
      );
    }

    // 5️⃣ Kiasi cha wakala = PRINCIPAL only
    const agentAmount =
      payment.appliedBreakdown?.principal || 0;

    // Hakuna cha kulipa
    if (agentAmount <= 0) {
      return {
        skipped: true,
        reason: "Hakuna principal ya kulipwa kwa agent",
      };
    }

    // 6️⃣ Zuia duplicate payout kwa payment hiyo hiyo
    const existing = await AgentPayout.findOne({
      payment: payment._id,
    });

    if (existing) {
      return {
        skipped: true,
        reason: "Payout tayari imeshatengenezwa",
      };
    }

    // 7️⃣ Create payout (PENDING)
    const payout = await AgentPayout.create({
      agent: agent._id,
      loan: loan._id,
      payment: payment._id,
      amount: agentAmount,
      status: "pending",

      // ⭐ SNAPSHOT — muhimu sana
      payoutAccount: {
        ...agent.primaryPayoutAccount,
      },

      reference: `AP-${Date.now()}`,
    });

    return {
      success: true,
      payoutId: payout._id,
      amount: agentAmount,
      agent: agent._id,
    };
  }

  /**
   * ======================================================
   * MARK PAYOUT AS PAID (ADMIN / CRON / INTEGRATION)
   * ======================================================
   */
  async markAsPaid(payoutId, meta = {}) {
    const payout = await AgentPayout.findById(payoutId);
    if (!payout) {
      throw new Error("AgentPayout haijapatikana");
    }

    if (payout.status === "paid") {
      return { message: "Payout tayari imeshalipwa" };
    }

    payout.status = "paid";
    payout.paidAt = new Date();
    payout.reference =
      meta.reference || payout.reference;

    await payout.save();

    return {
      success: true,
      payoutId: payout._id,
      status: "paid",
    };
  }

  /**
   * ======================================================
   * GET AGENT PAYOUT HISTORY
   * ======================================================
   */
  async getAgentPayouts(agentId) {
    return AgentPayout.find({ agent: agentId })
      .sort({ createdAt: -1 })
      .populate("loan")
      .populate("payment");
  }
}

module.exports = new AgentPayoutService();
