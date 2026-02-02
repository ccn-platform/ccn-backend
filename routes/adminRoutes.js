 const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

// 🔐 Apply auth + admin role globally
router.use(auth);
router.use(role("admin"));

// USERS
router.put("/users/:userId/block", adminController.blockUser);
router.put("/users/:userId/unblock", adminController.unblockUser);
router.delete("/users/:userId", adminController.deleteUser);

// AGENTS
router.get("/agents", adminController.getAllAgents);

// ✅ 🔎 SINGLE AGENT (ADD-ONLY)
router.get("/agents/:agentId", adminController.getAgentDetails);

router.get("/agents/category/:categoryId", adminController.getAgentsByCategory);
router.put("/agents/:agentId/approve", adminController.approveAgent);
router.put("/agents/:agentId/suspend", adminController.suspendAgent);
router.delete("/agents/:agentId", adminController.deleteAgent);

// CUSTOMERS
router.get("/customers", adminController.getAllCustomers);
router.get("/customers/:customerId", adminController.getCustomerProfile);
router.delete("/customers/:customerId", adminController.deleteCustomer);

// DASHBOARD
router.get("/stats", adminController.getSystemStats);

// LOANS
router.get("/loans", adminController.getAllLoans);
router.get("/loans/overdue", adminController.getOverdueLoans);
router.get("/loans/:loanId", adminController.getLoanDetails);
router.put("/loans/:loanId/force-close", adminController.forceCloseLoan);
router.delete("/loans/:loanId", adminController.deleteLoan);

// REVENUE & AUDIT
router.get("/revenue/report", adminController.getRevenueReport);
router.get("/audit-logs", adminController.getAuditLogs);

 

module.exports = router;
