 // routes/revenueRoutes.js

const express = require("express");
const router = express.Router();

const revenueController = require("../controllers/revenueController");

// Middlewares
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/**
 * ======================================================
 * REVENUE ROUTES (Admin Only)
 * ======================================================
 */

// 1️⃣ Record revenue from loan fees
router.post(
  "/record-loan",
  auth,
  role("admin"),
  revenueController.recordLoanRevenue
);

// 2️⃣ Record revenue from payment charges
router.post(
  "/record-payment",
  auth,
  role("admin"),
  revenueController.recordPaymentRevenue
);

// 3️⃣ Get total revenue
router.get(
  "/total",
  auth,
  role("admin"),
  revenueController.getTotalRevenue
);

// 4️⃣ Get revenue within a date range
router.get(
  "/report",
  auth,
  role("admin"),
  revenueController.getRevenueReport
);

module.exports = router;
