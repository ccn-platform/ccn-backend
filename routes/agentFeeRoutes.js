 // routes/agentFeeRoutes.js
const express = require("express");
const router = express.Router();

const agentFeeController = require("../controllers/agentFeeController");
const requireAuth = require("../middleware/requireAuth");
const requireAgent = require("../middleware/requireAgent");

/**
 * ======================================================
 * AGENT FEE ROUTES
 * PREFIX: /api/agent-fees
 * ======================================================
 */

router.get(
  "/me",
  requireAuth,
  requireAgent,
  agentFeeController.getMyAgentFeeStatus
);

router.get(
  "/plans",
  requireAuth,
  requireAgent,
  agentFeeController.getAgentFeePlans
);

router.post(
  "/me/request-payment",
  requireAuth,
  requireAgent,
  agentFeeController.requestAgentFeePayment
);

router.get(
  "/me/payments",
  requireAuth,
  requireAgent,
  agentFeeController.getMyAgentFeePayments
);

router.post(
  "/webhook/payment",
  agentFeeController.agentFeePaymentWebhook
);

module.exports = router;
