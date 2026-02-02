 // routes/riskRoutes.js

const express = require("express");
const router = express.Router();

const riskAssessmentController = require("../controllers/riskAssessmentController");

// MIDDLEWARES
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/**
 * ======================================================
 * 1️⃣ Run AI Risk Assessment (Admin + Agents only)
 * POST /api/risk/evaluate
 * ======================================================
 */
router.post(
  "/evaluate",
  auth,
  role("admin", "agent"),      // only authorized parties
  riskAssessmentController.evaluateRisk
);

/**
 * ======================================================
 * 2️⃣ Fetch customer risk assessment history
 * GET /api/risk/customer/:customerId
 * ======================================================
 */
router.get(
  "/customer/:customerId",
  auth,
  role("admin", "agent"),
  riskAssessmentController.getCustomerRiskHistory
);

/**
 * ======================================================
 * 3️⃣ Fetch latest risk for a specific loan
 * GET /api/risk/loan/:loanId/latest
 * ======================================================
 */
router.get(
  "/loan/:loanId/latest",
  auth,
  role("admin", "agent"),
  riskAssessmentController.getLoanLatestRisk
);

module.exports = router;
