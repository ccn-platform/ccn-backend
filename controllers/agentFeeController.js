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

    // 🔐 IP whitelist
 
const allowedIPs = [
  "74.220.49.248",
  "74.220.49.249",
  "74.220.49.253",
  "155.12.30.51"
];
    let ip =
  req.headers["x-forwarded-for"] ||
  req.socket.remoteAddress ||
  req.ip ||
  "";

ip = ip.split(",")[0].replace("::ffff:", "").trim();

    console.log("Webhook request IP:", ip);

    if (!ip.startsWith("155.") && !allowedIPs.includes(ip)) {
 return res.status(403).send("Unauthorized IP");
}
   console.log("ClickPesa webhook payload:", JSON.stringify(req.body));

   const payload = req.body.data || {};

const reference = payload.orderReference;
const transactionId = payload.paymentReference;
const status = payload.status;

   if (!status || status !== "SUCCESS") {
  console.log("Payment not successful:", status);
  return res.sendStatus(200);
}

     if (!reference) {
  console.log("Webhook missing reference");
  return res.sendStatus(200);
}

await agentFeeService.processPayment({
  reference,
  transactionId,
  provider: "clickpesa"
});

   console.log("Payment processed:", {
  reference,
  transactionId
});

    return res.sendStatus(200);

  } catch (error) {
    console.error("Webhook error:", error);
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
