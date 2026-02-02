 const express = require("express");
const router = express.Router();

const agentDashboardController = require("../controllers/agentDashboardController");

// ⭐ MIDDLEWARES SAHIHI
const requireAuth = require("../middleware/requireAuth");
const requireAgent = require("../middleware/requireAgent");

/**
 * ======================================================
 * AGENT DASHBOARD (SAFE — READ ONLY)
 * ======================================================
 */
router.get(
  "/dashboard",
  requireAuth,    // 🔐 JWT + req.user
  requireAgent,   // 🧠 hakikisha agent profile ipo
  agentDashboardController.getMyDashboard
);

module.exports = router;
