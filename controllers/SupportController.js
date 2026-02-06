  const FAQ = require("../models/FAQ");
const SupportTicket = require("../models/SupportTicket");
const User = require("../models/User");

class SupportController {

  // ===============================
  // CUSTOMER SIDE
  // ===============================

  // GET /support/faqs
  async getFaqs(req, res) {
    try {
      const faqs = await FAQ.find().sort({ createdAt: -1 });
      res.json(faqs);
    } catch (err) {
      res.status(500).json({ error: "Failed to load FAQs" });
    }
  }

  // POST /support/ticket
  async createTicket(req, res) {
    try {
      const { subject, message, contact } = req.body;

      const ticket = await SupportTicket.create({
        user: req.user?._id,
        subject,
        message,
        contact,
      });

      res.json({ success: true, ticket });
    } catch (err) {
      res.status(500).json({ error: "Failed to create ticket" });
    }
  }

  // ===============================
  // 🔵 ADMIN SIDE
  // ===============================

  /**
   * GET /admin/support/tickets
   * kuona tickets zote
   */
  async adminGetTickets(req, res) {
    try {
      const { status } = req.query;

      const filter = {};
      if (status) filter.status = status;

      const tickets = await SupportTicket.find(filter)
        .populate("user", "fullName phone email")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ tickets });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  }

  /**
   * GET SINGLE TICKET
   */
  async adminGetTicketById(req, res) {
    try {
      const ticket = await SupportTicket.findById(req.params.id)
        .populate("user", "fullName phone email")
        .lean();

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json({ ticket });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  }

  /**
   * ASSIGN TICKET TO ADMIN
   */
  async assignTicket(req, res) {
    try {
      const ticket = await SupportTicket.findByIdAndUpdate(
        req.params.id,
        {
          assignedTo: req.user._id,
          status: "in_progress",
        },
        { new: true }
      );

      res.json({ ticket });
    } catch (err) {
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  }

  /**
   * MARK AS RESOLVED
   */
  async resolveTicket(req, res) {
    try {
      const ticket = await SupportTicket.findByIdAndUpdate(
        req.params.id,
        {
          status: "resolved",
          resolvedAt: new Date(),
        },
        { new: true }
      );

      res.json({ ticket });
    } catch (err) {
      res.status(500).json({ error: "Failed to resolve ticket" });
    }
  }
}

module.exports = new SupportController();
