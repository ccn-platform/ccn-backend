 const express = require("express");
const router = express.Router();

const supportController = require("../controllers/SupportController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/**
 * =========================================
 * CUSTOMER ROUTES
 * =========================================
 */

// FAQs
router.get("/faqs", supportController.getFaqs);

// Create ticket
router.post("/ticket", auth, supportController.createTicket);

/**
 * =========================================
 * 🔵 ADMIN ROUTES
 * =========================================
 */

// kuona tickets zote
router.get(
  "/admin/tickets",
  auth,
  role("admin"),
  supportController.adminGetTickets
);

// kuona ticket moja
router.get(
  "/admin/tickets/:id",
  auth,
  role("admin"),
  supportController.adminGetTicketById
);

// assign ticket kwa admin
router.patch(
  "/admin/tickets/:id/assign",
  auth,
  role("admin"),
  supportController.assignTicket
);

// mark resolved
router.patch(
  "/admin/tickets/:id/resolve",
  auth,
  role("admin"),
  supportController.resolveTicket
);

module.exports = router;
