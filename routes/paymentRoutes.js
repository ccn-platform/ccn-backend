  
 const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/paymentController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// Log every payment request
const requestLogger = require("../middleware/requestLogger");
router.use(requestLogger);

/**
 * CUSTOMER PAYMENT
 */
router.post(
  "/pay",
  auth,
  paymentController.makePayment
);

/**
 * PAYMENT CALLBACK (MOBILE MONEY)
 */
router.post(
  "/callback",
  paymentController.processPayment
);

/**
 * PAY LOAN FEE (AGENT)
 */
router.post(
  "/pay-fee",
  auth,
  paymentController.payLoanFee
);
 
router.post(
  "/loans/:loanId/adjust",
  auth,               // 👈 TUMIA ILIYOPO
  role("agent"),      // 👈 OPTIONAL BUT RECOMMENDED
  (req, res) => {
    req.body.loanId = req.params.loanId;
    return paymentController.agentAdjustLoan(req, res);
  }
);

 
/**
 * ADMIN / TEST PAYMENT
 */
router.post(
  "/test",
  auth,
  role("admin"),
  paymentController.testPayment
);

module.exports = router;
