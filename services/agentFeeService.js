   const mongoose = require("mongoose");
const AgentFee = require("../models/agentFee");
const AgentFeePayment = require("../models/agentFeePayment");
const ControlNumber = require("../models/controlNumber");
const Agent = require("../models/Agent");
const dayjs = require("dayjs");
const generateReference = require("../utils/generateReference");

/**
 * ======================================================
 * PAYMENT FEE PLANS
 * ======================================================
 */
const PAYMENT_FEE_PLANS = {
  WEEKLY: {
    amount: 1300,
    duration: { value: 1, unit: "week" },
  },
  MONTHLY: {
    amount: 5000,
    duration: { value: 1, unit: "month" },
  },
  SEMI_ANNUAL: {
    amount: 30000,
    duration: { value: 6, unit: "month" },
  },
  ANNUAL: {
    amount: 60000,
    duration: { value: 1, unit: "year" },
  },
};

/**
 * ======================================================
 * RESOLVE AGENT OBJECT ID
 * ======================================================
 */
async function resolveAgentObjectId(agentId) {
  if (!agentId) throw new Error("Agent ID haipo");

  if (agentId === "TEMP_AGENT_ID") {
    throw new Error("Agent hajakamilisha usajili");
  }

  if (mongoose.Types.ObjectId.isValid(agentId)) return agentId;

  const agent = await Agent.findOne({ agentId }).select("_id");
  if (!agent) throw new Error("Agent hajapatikana");

  return agent._id;
}

/**
 * ======================================================
 * SYNC SNAPSHOT (DASHBOARD / GUARDS)
 * ======================================================
 */
async function syncAgentFeeSnapshot(agentId, fee) {
  await Agent.findByIdAndUpdate(agentId, {
    subscriptionSnapshot: {
      status: fee.status,
      expiresOn: fee.endDate,
      plan: fee.plan,
    },
  });
}

class AgentFeeService {
  
    /**
 * ======================================================
 * CREATE INITIAL FEE (FREE TRIAL – FIRST TIME ONLY)
 * ======================================================
 */
async createInitialFee(agentId) {
  const agentObjectId = await resolveAgentObjectId(agentId);

  // 🔎 Hakiki kama agent ana history
  const existing = await AgentFee.findOne({ agent: agentObjectId });

  if (existing) {
    // already exists → usiguse
    return existing;
  }

  // 🆓 FREE TRIAL: 1 MONTH
  const start = dayjs();
  const end = start.add(1, "month");

  const fee = await AgentFee.create({
    agent: agentObjectId,

    startDate: start.toDate(),
    endDate: end.toDate(),

    status: "active",
    plan: "FREE_TRIAL",

    amountPaid: 0,
    renewalCount: 0,

    notes: "Free trial – first registration (30 days)",
  });

  await syncAgentFeeSnapshot(agentObjectId, fee);

  return fee;
}

  /**
   * ======================================================
   * REQUEST PAYMENT (PLAN REQUIRED)
   * ======================================================
   */
  async requestPayment(agentId, planKey) {
    const plan = PAYMENT_FEE_PLANS[planKey];
    if (!plan) throw new Error("Payment plan haipo");

    const agentObjectId = await resolveAgentObjectId(agentId);

    let fee = await AgentFee.findOne({ agent: agentObjectId }).sort({
      createdAt: -1,
    });

    if (!fee) fee = await this.createInitialFee(agentObjectId);

    const control = await ControlNumber.create({
      customer: agentObjectId,
      amount: plan.amount,
      reference: generateReference.controlNumber(),
      source: "AGENT_FEE",
    });

    const payment = await AgentFeePayment.create({
      agent: agentObjectId,
      agentFee: fee._id,
      plan: planKey,
      amount: plan.amount,
      amountSnapshot: plan.amount,
      durationSnapshot: {
        value: plan.duration.value,
        unit: plan.duration.unit,
      },
      controlNumber: control._id,
      reference: generateReference.transactionId(),
      status: "pending",
    });

    /**
     * ======================================================
     * 🧪 LOCAL DEV AUTO-ACTIVATION (ADD ONLY)
     * ======================================================
     */
    if (process.env.NODE_ENV !== "production") {
      // mark payment as completed
      payment.status = "completed";
      payment.provider = "LOCAL_DEV";
      payment.processedAt = new Date();
      await payment.save();

      // mark control number as paid
      control.status = "paid";
      await control.save();

      // activate subscription immediately
      await this.renew(agentObjectId, payment.reference, plan.amount, {
        planKey,
        controlNumber: control._id,
      });
    }

    return {
      plan: planKey,
      amount: plan.amount,
      controlNumber: control.reference,
      localAutoActivated: process.env.NODE_ENV !== "production",
    };
  }

  /**
   * ======================================================
   * RENEW FEE (BASED ON PLAN)
   * ======================================================
   */
  async renew(agentId, paymentRef, amount, meta = {}) {
    const { planKey } = meta;
    const plan = PAYMENT_FEE_PLANS[planKey];
    if (!plan) throw new Error("Plan haipo kwa renewal");

    const agentObjectId = await resolveAgentObjectId(agentId);

    let fee = await AgentFee.findOne({ agent: agentObjectId }).sort({
      createdAt: -1,
    });

    if (!fee) fee = await this.createInitialFee(agentObjectId);

    const start = fee.endDate ? dayjs(fee.endDate) : dayjs();
    const newEnd = start.add(plan.duration.value, plan.duration.unit);

    fee.startDate = start.toDate();
    fee.endDate = newEnd.toDate();
    fee.status = "active";
    fee.plan = planKey;
    fee.amountPaid += amount;
    fee.lastPaymentRef = paymentRef;
    fee.lastControlNumber = meta.controlNumber || null;
    fee.renewalCount += 1;

    await fee.save();
    await syncAgentFeeSnapshot(agentObjectId, fee);

    return {
      success: true,
      plan: planKey,
      expiresOn: newEnd.format("YYYY-MM-DD"),
    };
  }

  /**
   * ======================================================
   * PROCESS PAYMENT (WEBHOOK – PRODUCTION)
   * ======================================================
   */
  async processPayment({ reference, transactionId, provider }) {
    const control = await ControlNumber.findOne({ reference });
    if (!control) throw new Error("Control number haipo");

    const payment = await AgentFeePayment.findOne({
      controlNumber: control._id,
    });

    if (!payment || payment.status === "completed") {
      return { message: "Tayari imelipwa" };
    }

    const planKey = payment.plan;

    payment.status = "completed";
    payment.transactionId = transactionId;
    payment.provider = provider;
    payment.processedAt = new Date();
    await payment.save();

    control.status = "paid";
    await control.save();

    return this.renew(payment.agent, transactionId, payment.amount, {
      controlNumber: control._id,
      planKey,
    });
  }

  /**
   * ======================================================
   * PAYMENT HISTORY
   * ======================================================
   */
  async getPaymentHistory(agentId) {
    const agentObjectId = await resolveAgentObjectId(agentId);
    return AgentFeePayment.find({ agent: agentObjectId }).sort({
      createdAt: -1,
    });
  }
}

module.exports = new AgentFeeService();
