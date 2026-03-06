  const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// 🔎 Log every payment request
const requestLogger = require("../middleware/requestLogger");
router.use(requestLogger);

/**
 * ======================================================
 * CUSTOMER / AGENT PAYMENT (INSTALLMENT PAYMENT)
 * ======================================================
 */
router.post(
  "/pay",
  auth,
  paymentController.makePayment
);

/**
 * ======================================================
 * AGENT PAY LOAN FEE (CLEAR LOAN)
 * ======================================================
 */
router.post(
  "/loans/:loanId/pay-fee",
  auth,
  role("agent"),
  (req, res) => {
    req.body.loanId = req.params.loanId;
    return paymentController.payLoanFee(req, res);
  }
);

 
/**
 * ======================================================
 * PAYMENT CALLBACK (MOBILE MONEY / GATEWAY)
 * ======================================================
 */
router.post(
  "/callback",
  paymentController.processPayment
);

/**
 * ======================================================
 * ADMIN / TEST PAYMENT
 * ======================================================
 */
router.post(
  "/test",
  auth,
  role("admin"),
  paymentController.testPayment
);

module.exports = router;
