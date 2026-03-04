  // controllers/agentFeeController.js
const agentFeeService = require("../services/agentFeeService");
const Agent = require("../models/Agent");
const crypto = require("crypto");
/**
 * ======================================================
 * RESOLVE AGENT ID FROM AUTH
 * ======================================================
 */
async function getAgentIdFromRequest(req) {
  if (req.user?.agentId && req.user.agentId !== "TEMP_AGENT_ID") {
    return req.user.agentId;
  }

  const agent = await Agent.findOne({ user: req.user._id }).select("_id agentId");
  if (!agent) {
    throw new Error("Agent account haijaunganishwa na user huyu.");
  }

  return agent._id;
}

/**
 * ======================================================
 * GET MY AGENT FEE STATUS
 * ======================================================
 */
exports.getMyAgentFeeStatus = async (req, res, next) => {
  try {
    const agentId = await getAgentIdFromRequest(req);
    const status = await agentFeeService.checkStatus(agentId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * ======================================================
 * LIST PAYMENT PLANS
 * ======================================================
 */
exports.getAgentFeePlans = async (req, res) => {
  res.json({
    success: true,
    data: {
      WEEKLY: { amount: 1300, duration: "1 week" },
      MONTHLY: { amount: 5000, duration: "1 month" },
      SEMI_ANNUAL: { amount: 30000, duration: "6 months" },
      ANNUAL: { amount: 60000, duration: "1 year" },
    },
  });
};

/**
 * ======================================================
 * REQUEST AGENT FEE PAYMENT
 * ======================================================
 */
exports.requestAgentFeePayment = async (req, res, next) => {
  try {
    const agentId = await getAgentIdFromRequest(req);
  const { planKey } = req.body;

 if (!planKey) {
  return res.status(400).json({
    success: false,
    message: "PlanKey inahitajika"
  });
}

const data = await agentFeeService.requestPayment(
  agentId,
  planKey,
);

     res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * ======================================================
 * PAYMENT WEBHOOK
 * ======================================================
 */
 exports.agentFeePaymentWebhook = async (req, res, next) => {
  try {
 const signature = req.headers["x-clickpesa-signature"];

if (!signature) {
  return res.status(400).send("Missing webhook signature");
}

const payload = JSON.stringify(req.body);

const expectedSignature = crypto
  .createHmac("sha256", process.env.CLICKPESA_WEBHOOK_SECRET)
  .update(payload)
  .digest("hex");

if (signature !== expectedSignature) {
  return res.status(401).send("Invalid webhook signature");
}

 

    const { reference, transaction_id, status } = req.body;

    // ⭐ Verify payment success
    if (status !== "SUCCESS") {
      return res.sendStatus(200);
    }

    await agentFeeService.processPayment({
      reference,
      transactionId: transaction_id,
      provider: "clickpesa",
    });

    res.sendStatus(200);

  } catch (error) {
    next(error);
  }
};

/**
 * ======================================================
 * PAYMENT HISTORY
 * ======================================================
 */
exports.getMyAgentFeePayments = async (req, res, next) => {
  try {
    const agentId = await getAgentIdFromRequest(req);
    const history = await agentFeeService.getPaymentHistory(agentId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
