 // services/payoutService.js

const Agent = require("../models/Agent");
const PayoutAccount = require("../models/payoutAccount");

/**
 * ======================================================
 * 🆕 SAFE NORMALIZER (ADD ONLY)
 * ======================================================
 * - Hairekebishi data nyingine
 * - Huzuia 400 zisizoeleweka
 * - Inalingana na unique index ya Mongo
 */
function normalizeAccountNumber(value) {
  if (!value || typeof value !== "string") return value;

  return value
    .replace(/\s+/g, "")   // ondoa spaces
    .replace(/[-_]/g, "")  // ondoa dash/underscore
    .trim();
}

/**
 * ======================================================
 * PAYOUT SERVICE
 * ======================================================
 * - Inahusika NA PAYOUT TU
 * - Haitengenezi agent
 * - Haitoi mikopo
 * - Inasimamia akaunti za kupokea malipo
 * ======================================================
 */

class PayoutService {
  /**
   * ======================================================
   * CREATE / SET PRIMARY PAYOUT ACCOUNT
   * ======================================================
   * - Inatumiwa na /setup-payout
   * - Mobile money au Bank
   * - Inahakikisha PRIMARY ni moja tu
   */
  async createPayoutAccount(agentId, payload) {
    // 1️⃣ Hakikisha agent yupo
    const agent = await Agent.findById(agentId);
    if (!agent) {
      throw new Error("Agent hakupatikana");
    }

    // 2️⃣ Hakikisha payload muhimu zipo
    if (!payload.accountNumber || !payload.type) {
      throw new Error("Taarifa za payout hazijakamilika");
    }

    // 🆕 ADD ONLY — NORMALIZE ACCOUNT NUMBER
    const normalizedAccountNumber = normalizeAccountNumber(
      payload.accountNumber
    );

    // 🆕 ADD ONLY — ZUIA DUPLICATE ACCOUNT NUMBER
    const existing = await PayoutAccount.findOne({
      agent: agentId,
      accountNumber: normalizedAccountNumber,
      isActive: true,
    });

    if (existing) {
      throw new Error(
        "Akaunti hii ya malipo tayari imesajiliwa kwa wakala huyu"
      );
    }

    // 3️⃣ ZIMA primary ya zamani (kama ipo)
    if (payload.isPrimary) {
      await PayoutAccount.updateMany(
        { agent: agent._id, isPrimary: true },
        { $set: { isPrimary: false } }
      );
    }

    // 4️⃣ TENGENEZA PAYOUT MPYA
    const payout = await PayoutAccount.create({
      agent: agent._id,
      type: payload.type, // mobile_money | bank

      provider: payload.provider || null,
      bankName: payload.bankName || null,

      // 🆕 ADD ONLY — TUMIA ILIYOSAFISHWA
      accountNumber: normalizedAccountNumber,
      accountName: payload.accountName || null,

      isPrimary: payload.isPrimary === true,
      isActive: true,
    });

    // 5️⃣ 🔗 LINK PAYOUT KWA AGENT (REFERENCE TU)
    if (payout.isPrimary) {
      agent.primaryPayoutAccount = payout._id;
      await agent.save();
    }

    return payout;
  }

  /**
   * ======================================================
   * GET ALL PAYOUT ACCOUNTS FOR AGENT
   * ======================================================
   * - Inatumika na dashboard
   * - Inatumika ku-check kama setup imefanyika
   */
  async getAgentPayoutAccounts(agentId) {
    return PayoutAccount.find({
      agent: agentId,
      isActive: true,
    }).sort({
      isPrimary: -1,
      createdAt: -1,
    });
  }

  /**
   * ======================================================
   * GET PRIMARY PAYOUT ACCOUNT
   * ======================================================
   * - Inatumika wakati wa payout
   * - Inatumika kuzuia agent asiendelee bila setup
   */
  async getPrimaryPayoutAccount(agentId) {
    return PayoutAccount.findOne({
      agent: agentId,
      isPrimary: true,
      isActive: true,
    });
  }

  /**
   * ======================================================
   * SET PAYOUT ACCOUNT AS PRIMARY
   * ======================================================
   * - Agent anaweza kubadilisha primary
   */
  async setPrimaryPayoutAccount(agentId, payoutId) {
    const payout = await PayoutAccount.findOne({
      _id: payoutId,
      agent: agentId,
      isActive: true,
    });

    if (!payout) {
      throw new Error("Payout account haijapatikana");
    }

    // ZIMA primary zote za zamani
    await PayoutAccount.updateMany(
      { agent: agentId, isPrimary: true },
      { $set: { isPrimary: false } }
    );

    // WEKA HII KUWA PRIMARY
    payout.isPrimary = true;
    await payout.save();

    // LINK KWA AGENT
    await Agent.findByIdAndUpdate(agentId, {
      primaryPayoutAccount: payout._id,
    });

    return payout;
  }

  /**
   * ======================================================
   * DEACTIVATE PAYOUT ACCOUNT (SAFE DELETE)
   * ======================================================
   * - Haitoi record DB
   * - Inazuia matumizi yake
   * - HAIWEZI kufuta primary ya mwisho
   */
  async deactivatePayoutAccount(agentId, payoutId) {
    const payout = await PayoutAccount.findOne({
      _id: payoutId,
      agent: agentId,
    });

    if (!payout) {
      throw new Error("Payout account haijapatikana");
    }

    // 🆕 ADD ONLY — USIFUTE PRIMARY YA MWISHO
    const activeCount = await PayoutAccount.countDocuments({
      agent: agentId,
      isActive: true,
    });

    if (activeCount === 1 && payout.isPrimary) {
      throw new Error(
        "Lazima uwe na akaunti moja ya primary angalau"
      );
    }

    payout.isActive = false;
    payout.isPrimary = false;
    await payout.save();

    // Kama ilikuwa primary, iondoe pia kwa agent
    await Agent.updateOne(
      { _id: agentId, primaryPayoutAccount: payout._id },
      { $unset: { primaryPayoutAccount: 1 } }
    );

    return true;
  }
}

module.exports = new PayoutService();
