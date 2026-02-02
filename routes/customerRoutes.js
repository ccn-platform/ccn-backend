 // routes/customerRoutes.js

const express = require("express");
const router = express.Router();

const customerController = require("../controllers/customerController");

const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");

router.use(require("../middleware/requestLogger"));
router.use(require("../middleware/securityHeaders"));

/** -----------------------------
 * ⭐ NEW — LOOKUP CUSTOMER BY PHONE (NORMALIZED)
 * SAFE ADDITION
 * ----------------------------- */
router.get(
  "/by-phone/:phone",
  auth,
  roles("admin", "agent"),
  customerController.getByPhone
);

/** -----------------------------
 * CUSTOMER CRUD
 * ----------------------------- */

router.post("/", auth, roles("admin"), customerController.create);

router.get(
  "/:customerId",
  auth,
  roles("admin", "agent", "customer"),
  customerController.getOne
);

router.put(
  "/:customerId",
  auth,
  roles("customer", "admin"),
  customerController.update
);

/** -----------------------------
 * PAYMENTS
 * ----------------------------- */

router.post("/:customerId/payments", auth, customerController.addPayment);

router.get("/:customerId/payments", auth, customerController.getPayments);

router.get("/payment/:paymentId", auth, customerController.getPayment);

router.put(
  "/payment/:paymentId/status",
  auth,
  roles("admin"),
  customerController.updatePaymentStatus
);

router.put(
  "/payment/:paymentId/partial",
  auth,
  customerController.partialPayment
);

/** -----------------------------
 * SUMMARY + LOAN CHECK
 * ----------------------------- */

router.get(
  "/:customerId/payments/summary",
  auth,
  customerController.sumPayments
);

router.get(
  "/loan/:loanId/cleared",
  auth,
  customerController.checkLoanCleared
);

/** -----------------------------
 * CUSTOMER LOANS
 * ----------------------------- */

router.post(
  "/:customerId/loan/request",
  auth,
  roles("customer"),
  customerController.requestLoan
);

router.get(
  "/:customerId/loans",
  auth,
  roles("customer"),
  customerController.getMyLoans
);

router.get(
  "/loan/details/:loanId",
  auth,
  customerController.getLoanDetails
);

module.exports = router;
