  const mongoose = require("mongoose");
const AgentFee = require("../models/agentFee");
const AgentFeePayment = require("../models/agentFeePayment");
 
const Agent = require("../models/Agent");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
dayjs.extend(utc);

const generateReference = require("../utils/generateReference");
 const clickpesaService = require("./clickpesaService");
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

  const fee = await AgentFee.create({
  agent: agentObjectId,

  startDate: null,
  endDate: null,

  status: "inactive",
  plan: null,

  amountPaid: 0,
  renewalCount: 0,

  notes: "Subscription required",
});

    
  await syncAgentFeeSnapshot(agentObjectId, fee);

  return fee;
}
/**
 * ======================================================
 * CHECK SUBSCRIPTION STATUS (INCLUDES FREE TRIAL)
 * ======================================================
 */
async checkStatus(agentId) {
  const agentObjectId = await resolveAgentObjectId(agentId);

  let fee = await AgentFee.findOne({ agent: agentObjectId });
  if (!fee) {
    fee = await this.createInitialFee(agentObjectId);
  }

  if (!fee.endDate) {
    return {
      isActive: false,
      status: "inactive",
      remainingDays: 0,
    };
  }

   const today = dayjs().utc();
   const expiry = dayjs(fee.endDate).utc();


const hoursLeft = expiry.diff(today, "hour");

if (hoursLeft <= 0) {
  fee.status = "expired";
  await fee.save();
  await syncAgentFeeSnapshot(agentObjectId, fee);

  return {
    isActive: false,
    status: "expired",
    remainingDays: 0,
    expiresOn: expiry.format("YYYY-MM-DD"),
    plan: fee.plan,
  };
}

return {
  isActive: true,
  status: "active",
  remainingDays: Math.ceil(hoursLeft / 24),
  expiresOn: expiry.format("YYYY-MM-DD"),
  plan: fee.plan,
};
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
  // ⭐ pata phone ya agent kutoka database
const agent = await Agent.findById(agentObjectId);

if (!agent || !agent.phone) {
  throw new Error("Agent phone haijapatikana");
}

const phone = agent.phone;

   let fee = await AgentFee.findOne({ agent: agentObjectId });

  if (!fee) fee = await this.createInitialFee(agentObjectId);

  const reference = generateReference.transactionId();

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
    reference: reference,
    status: "pending",
    provider: "clickpesa",
  });

  // ⭐ MOBILE MONEY PUSH
  await clickpesaService.mobilePush(
    phone,
    plan.amount,
    reference
  );

  return {
    reference,
    amount: plan.amount,
    plan: planKey
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

    let fee = await AgentFee.findOne({ agent: agentObjectId });
    if (!fee) fee = await this.createInitialFee(agentObjectId);

     const now = dayjs().utc();


   // kama bado active → ongeza juu ya expiry iliyopo
    const base =
      fee.endDate && dayjs(fee.endDate).utc().isAfter(now)
       ? dayjs(fee.endDate).utc()
        : now;

    const newEnd = base.add(plan.duration.value, plan.duration.unit);

    fee.startDate = base.toDate();   // 🔥 HII NDIYO FIX
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
 
    const payment = await AgentFeePayment.findOne({ reference });

if (!payment) {
  throw new Error("Payment reference haipo");
}

if (payment.status === "completed") {
  return { message: "Payment already processed" };
}

// prevent duplicate transaction
if (payment.transactionId) {
  return { message: "Duplicate webhook ignored" };
}
  const planKey = payment.plan;

  payment.status = "completed";
  payment.transactionId = transactionId;
  payment.provider = provider;
  payment.processedAt = new Date();

  await payment.save();

  return this.renew(payment.agent, transactionId, payment.amount, {
    planKey,
  });
}
  /**
   * ======================================================
   * PAYMENT HISTORY
   * ======================================================
   */
 /**
 * ======================================================
 * PAYMENT HISTORY
 * ======================================================
 */
async getPaymentHistory(agentId) {

  const agentObjectId = await resolveAgentObjectId(agentId);

  return AgentFeePayment.find({ agent: agentObjectId })
    .sort({ createdAt: -1 })
    .lean();

}
}

module.exports = new AgentFeeService();
