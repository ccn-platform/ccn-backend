 
 

   const express = require("express");
 const router = express.Router();
 
 const loanController = require("../controllers/loanController");
 const auth = require("../middleware/authMiddleware");
 const role = require("../middleware/roleMiddleware");
 
 /**
  * ======================================================
  * CUSTOMER ROUTES
  * ======================================================
  */
 
 router.post(
   "/request-by-phone",
   auth,
   role("customer"),
   loanController.requestLoanByPhone
 );
 
 router.post(
   "/request",
   auth,
   role("customer"),
   loanController.requestLoan
 );
 
 router.get(
   "/my",
   auth,
   role("customer"),
   loanController.getMyLoans
 );
 
 router.get(
   "/customer/:customerId",
   auth,
   role("customer"),
   loanController.getLoansByCustomer
 );
 
 /**
  * ======================================================
  * AGENT ROUTES
  * ======================================================
  */
 
 router.get(
   "/pending",
   auth,
   role("agent"),
   loanController.getPendingLoans
 );
 
 router.post(
   "/:loanId/agent-approve",
   auth,
   role("agent"),
   loanController.agentApproveLoan
 );
 
router.get(
  "/agent/customer/:systemId",
  auth,
  role("agent"),
  (req, res, next) => {
    if (!req.params.systemId) {
      return res.status(400).json({
        success: false,
        message: "systemId is required",
      });
    }
    next();
  },
  loanController.getCustomerDebtsForAgent
);     
 /**
  * 🆕 AGENT → REJECT LOAN (NEW – SAFE)
  */
 router.post(
   "/:loanId/agent-reject",
   auth,
   role("agent"),
   loanController.agentRejectLoan
 );
 
 /**
  * ⭐ 🆕 AGENT → GET CUSTOMER DEBTS (LOAN REVIEW)
  */
 router.get(
   "/:loanId/customer-debts",
   auth,
   role("agent"),
   loanController.getCustomerDebtsForLoanReview
 );
 
 /**
  * ======================================================
  * ADMIN SNAPSHOT ROUTES
  * ======================================================
  */
 
 router.get(
   "/admin/snapshots",
   auth,
   role("admin"),
   loanController.adminGetLoansWithSnapshot
 );
 
 router.get(
   "/admin/snapshots/:loanId",
   auth,
   role("admin"),
   loanController.adminGetLoanSnapshot
 );
 /**
  * ======================================================
  * AGENT SNAPSHOT ROUTES
  * ======================================================
  */
 
 router.get(
   "/agent/snapshots",
   auth,
   role("agent"),
   loanController.agentGetLoansWithSnapshot
 );
 
 router.get(
   "/agent/snapshots/:loanId",
   auth,
   role("agent"),
   loanController.agentGetLoanSnapshot
 );
 

 // routes/loanRoutes.js
 
  



 /**
 * ======================================================
 * ⭐ GET CUSTOMER DEBTS (NEW - SAFE)
 * ======================================================
 */
router.get(
  "/customer/:customerId/debts",
  auth,
  loanController.getCustomerDebts
);

 /**
  * ======================================================
  * SHARED
  * ======================================================
  */
 

 router.get(
   "/:id",
   auth,
   loanController.getLoanById
 );
 
 module.exports = router;
 
