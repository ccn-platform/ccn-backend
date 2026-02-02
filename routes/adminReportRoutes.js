const express = require("express");
const router = express.Router();

const ReportController = require("../controllers/reportController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// ===============================
// DASHBOARD
// ===============================
router.get("/daily", auth, role("admin"), ReportController.dailyReport);
router.get("/monthly", auth, role("admin"), ReportController.monthlyReport);

// ===============================
// USERS / CUSTOMERS
// ===============================
router.get("/users/stats", auth, role("admin"), ReportController.userStats);

router.get(
  "/customers/:customerId/debt",
  auth,
  role("admin"),
  ReportController.customerDebtReport
);

// ===============================
// REVENUE
// ===============================
router.get(
  "/revenue/range",
  auth,
  role("admin"),
  ReportController.revenueByDateRange
);

router.get(
  "/revenue/agents",
  auth,
  role("admin"),
  ReportController.revenueByAgent
);

router.get(
  "/revenue/top-agents",
  auth,
  role("admin"),
  ReportController.topAgents
);

// ===============================
// FEES (ADA)
// ===============================
router.get(
  "/fees/daily",
  auth,
  role("admin"),
  ReportController.dailyFeeRevenue
);

router.get(
  "/fees/weekly",
  auth,
  role("admin"),
  ReportController.weeklyFeeRevenue
);

router.get(
  "/fees/monthly",
  auth,
  role("admin"),
  ReportController.monthlyFeeRevenue
);

// ===============================
// LOANS
// ===============================
router.get(
  "/loans/risk",
  auth,
  role("admin"),
  ReportController.loanRiskReport
);

router.get(
  "/loans/performance",
  auth,
  role("admin"),
  ReportController.loanPerformance
);

module.exports = router;
