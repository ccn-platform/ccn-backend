 const express = require("express");
const router = express.Router();

const agentController = require("../controllers/agentController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const Agent = require("../models/Agent");

/**
 * ======================================================
 * 🔐 SAFE GUARD (UNCHANGED)
 * ======================================================
 */
const ensureAgent = async (req, res, next) => {
  try {
    if (req.user.agentId) return next();

    const agent = await Agent.findOne({ user: req.user._id });

    if (!agent) {
      return res.status(403).json({
        message: "Account hii haina agent profile",
      });
    }

    req.user.agentId = agent._id;
    next();
  } catch (err) {
    return res.status(500).json({
      message: "Imeshindikana kuthibitisha agent",
    });
  }
};

/* ======================================================
 * ADMIN ROUTES (HAIJAGUSWA)
 * ====================================================== */
router.post("/", auth, role("admin"), agentController.createAgent);
router.put("/:agentId/verify", auth, role("admin"), agentController.verifyAgent);
router.put("/:agentId/freeze", auth, role("admin"), agentController.freezeAgent);

/* ======================================================
 * AGENT ROUTES (HAIJAGUSWA)
 * ====================================================== */
router.get(
  "/me/customers",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getMyCustomers
);

router.get(
  "/me/loans",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getMyLoans
);

router.post(
  "/me/loans/:loanId/control-number",
  auth,
  role("agent"),
  ensureAgent,
  agentController.requestControlNumber
);

router.get(
  "/me/risk",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getRiskReport
);

router.get(
  "/me/subscription",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getMySubscriptionInfo
);

router.get(
  "/me/financials",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getMyFinancialTotals
);

router.get(
  "/me/activity",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getMyRecentActivity
);

// 🧾 FEES LAST 30 DAYS
router.get(
  "/me/fees-last-30-days",
  auth,
  role("agent"),
  ensureAgent,
  agentController.getFeesLast30Days
);

module.exports = router;
