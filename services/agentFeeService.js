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
 // ======================================================
// SEND PUSH WITH RETRY (IMPROVES SUCCESS RATE)
// ======================================================

async sendPushWithRetry(phone, amount, reference) {

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {

    try {

      console.log(`📲 Sending push attempt ${attempt + 1}`);

      const result = await clickpesaService.mobilePush(
        phone,
        amount,
        reference
      );

      console.log("ClickPesa push sent:", result);

      return result;

    } catch (error) {

      attempt++;

      console.log(`⚠ Push attempt ${attempt} failed`);

      if (attempt >= maxRetries) {
        throw new Error("Push failed after multiple attempts");
      }

      // subiri sekunde 20 kabla ya retry
      await new Promise(resolve => setTimeout(resolve, 20000));

    }
  }
}
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
   const start = dayjs().utc();
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

 await this.cleanupExpiredPendingPayments();

  const plan = PAYMENT_FEE_PLANS[planKey];
  if (!plan) throw new Error("Payment plan haipo");

  const agentObjectId = await resolveAgentObjectId(agentId);
  // ⭐ pata phone ya agent kutoka database
 const agent = await Agent.findById(agentObjectId).select("phone");

if (!agent || !agent.phone) {
  throw new Error("Agent phone haijapatikana");
}
 
const phone = agent.phone;

    let fee = await AgentFee.findOne({ agent: agentObjectId });

  if (!fee) fee = await this.createInitialFee(agentObjectId);

 const existingPending = await AgentFeePayment.findOne({
  agent: agentObjectId,
  status: "pending",
  expiresAt: { $gt: new Date() }
});

if (existingPending) {
  return {
    reference: existingPending.reference,
    amount: existingPending.amount,
    plan: existingPending.plan
  };
}
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
      // ⭐ ADD THIS
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),

    status: "pending",
    provider: "clickpesa",
  });

  // ⭐ MOBILE MONEY PUSH
 try {

   await this.sendPushWithRetry(
  phone,
  plan.amount,
  reference
);

} catch (error) {

  await AgentFeePayment.deleteOne({ reference });

  throw new Error("Imeshindikana kutuma ombi la malipo");

}
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
    if (!planKey || !PAYMENT_FEE_PLANS[planKey]) {
  throw new Error("Payment plan haipo");
}

const plan = PAYMENT_FEE_PLANS[planKey];

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
 
  const payment = await AgentFeePayment.findOneAndUpdate(
  { reference, status: "pending" },
  {
    status: "completed",
    transactionId,
    provider,
    processedAt: new Date()
  },
  { new: true }
);

if (!payment) {
  return { message: "Payment already processed or not found" };
}

const planKey = payment.plan;

return this.renew(payment.agent, transactionId, payment.amount, {
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

  return AgentFeePayment.find({ agent: agentObjectId })
    .sort({ createdAt: -1 })
    .lean();

}
/**
 * ======================================================
 * CLEANUP OLD PENDING PAYMENTS
 * ======================================================
 */
 async cleanupExpiredPendingPayments() {
  await AgentFeePayment.updateMany(
    {
      status: "pending",
      expiresAt: { $lt: new Date() }
    },
    {
      status: "failed"
    }
  );
}
}
 

module.exports = new AgentFeeService();
