 const Loan = require("../models/Loan");
const Agent = require("../models/Agent");
const AgentSubscription = require("../models/agentFee");

class AgentDashboardController {
  /**
   * ======================================================
   * GET AGENT DASHBOARD
   * ======================================================
   */
  async getMyDashboard(req, res) {
    try {
      /**
       * ======================================================
       * ✅ RESOLVE AGENT CORRECTLY (FIXED)
       * ======================================================
       * Priority:
       * 1️⃣ req.user.agentId (ObjectId) → findById
       * 2️⃣ fallback: Agent.user = req.user._id
       */
      let agent = null;

      // 1️⃣ PRIMARY — agentId injected by requireAgent / requireAuth
      if (req.user?.agentId) {
        agent = await Agent.findById(req.user.agentId)
          .populate("businessCategory")
          .lean();
      }

      // 2️⃣ FALLBACK — legacy / safety
      if (!agent && req.user?._id) {
        agent = await Agent.findOne({ user: req.user._id })
          .populate("businessCategory")
          .lean();
      }

      // 🛑 FINAL GUARD
      if (!agent) {
        return res.status(403).json({
          success: false,
          message:
            "Agent account haijaunganishwa na user huyu. Tafadhali login tena au wasiliana na admin.",
        });
      }

      const agentId = agent._id;

      // ======================================================
      // EXISTING — LOANS (UNCHANGED)
      // ======================================================
      const loans = await Loan.find({ agent: agentId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      // ======================================================
      // EXISTING — AGENT PROFILE (UNCHANGED)
      // ======================================================
      const agentProfile = {
        agentId: agent.agentId || null,
        fullName: agent.fullName || null,
        phone: agent.phone || null,
        businessName: agent.businessName || null,
        categoryName: agent.businessCategory?.name || null,
      };

      // ======================================================
      // 🆕 SUBSCRIPTION INFO (SAFE)
      // ======================================================
      let subscription = null;

      const sub = await AgentSubscription.findOne({ agent: agentId })
        .sort({ endDate: -1 })
        .lean();

      if (sub) {
        const today = new Date();

        const diffDays =
          Math.ceil(
            (new Date(sub.endDate).getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          ) || 0;

        subscription = {
          status: sub.status,
          plan: sub.plan || "UNKNOWN",
          daysRemaining: diffDays > 0 ? diffDays : 0,
          expiresOn: sub.endDate,

          // frontend helpers
          isActive: sub.status === "active" && diffDays > 0,
          isExpired: sub.status === "expired" || diffDays <= 0,
        };
      }

      // ======================================================
      // 🆕 STATS (SAFE)
      // ======================================================
      const stats = {
        totalLoans: loans.length,
        activeLoans: loans.filter((l) => l.status === "active").length,
        overdueLoans: loans.filter((l) => l.status === "overdue").length,
      };

      // ======================================================
      // ✅ FINAL RESPONSE
      // ======================================================
      return res.json({
        success: true,
        loans,
        agentProfile,
        subscription,
        stats,
      });
    } catch (err) {
      console.error("AGENT DASHBOARD ERROR:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to load agent dashboard",
      });
    }
  }
}

module.exports = new AgentDashboardController();
