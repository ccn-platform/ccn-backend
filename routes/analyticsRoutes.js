 const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/AnalyticsController");

// Middlewares
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const requestLogger = require("../middleware/requestLogger");
const rateLimiter = require("../middleware/rateLimiter");

// Global middlewares
router.use(requestLogger);
router.use(rateLimiter);

// Admin only
router.use(auth);
router.use(role("admin"));

/**
 * ======================================================
 * CORE ANALYTICS (EXISTING)
 * ======================================================
 */
router.get("/daily", analyticsController.getDailyMetrics);
router.get("/weekly-growth", analyticsController.getWeeklyGrowth);
router.get("/revenue", analyticsController.getRevenueSummary);
router.get("/portfolio", analyticsController.getLoanPortfolio);
router.get("/top-agents", analyticsController.getTopAgents);
router.get("/health", analyticsController.getSystemHealth);

/**
 * ======================================================
 * ➕➕➕ NEW ADMIN ANALYTICS (SAFE ADDITIONS)
 * ======================================================
 */
router.get("/repayment-rate", analyticsController.getRepaymentRate);
router.get("/average-loan-size", analyticsController.getAverageLoanSize);
router.get("/agent-performance", analyticsController.getAgentPerformance);
router.get("/customer-retention", analyticsController.getCustomerRetention);

module.exports = router;
