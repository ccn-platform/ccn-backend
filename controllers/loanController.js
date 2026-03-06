  
 
 const loanService = require("../services/loanService");
const Loan = require("../models/Loan");
const Agent = require("../models/Agent");
const User = require("../models/User");
const ControlNumber = require("../models/controlNumber"); // ✅ ADDED (SAFE)
 const PayoutAccount = require("../models/payoutAccount");

class LoanController {
  /** =====================================================
   * 0️⃣ CUSTOMER → REQUEST LOAN (AGENT ID PRIMARY)
   * ===================================================== */
  async requestLoanByPhone(req, res) {
    try {
      const customerId = req.user.userId || req.user.id || req.user._id;

      const result = await loanService.requestLoanByPhone(
        {
          agentId: req.body.agentId,
          agentPhone: req.body.agentPhone,
          items: req.body.items,
          repaymentPeriod: req.body.repaymentPeriod,
        },
        customerId
      );

      return res.json(result);
    } catch (err) {
      console.log("Loan Request Error:", err);
      return res.status(400).json({
        success: false,
        message: err.message
     });
    }
  }

   
  /** =====================================================
   * 2️⃣ CUSTOMER → GET MY LOANS (TOKEN BASED)
   * ===================================================== */
  async getMyLoans(req, res) {
    try {
      const customerId = req.user.userId || req.user.id || req.user._id;

       const loans = await Loan.find({ customer: customerId })
         .populate({
          path: "agent",
          select: "businessName user",
          populate: {
            path: "user",
            select: "phone fullName"
         }
       })
        .sort({ createdAt: -1 })
         .lean();


      const loanIds = loans.map(l => l._id);

      const controlNumbers = await ControlNumber.find({
        loan: { $in: loanIds },
        status: "active",
      }).lean();

      const controlMap = {};
      controlNumbers.forEach(cn => {
        controlMap[String(cn.loan)] = cn.reference;
      });
    // ==============================
    // ⭐ PATA PAYOUT ACCOUNT ZA AGENT
    // ==============================
     const agentIds = loans
       .map(l => l.agent?._id)
       .filter(Boolean);

    const payoutAccounts = await PayoutAccount.find({
       agent: { $in: agentIds },
       isPrimary: true,
       isActive: true,
      }).lean();

      const payoutMap = {};
       payoutAccounts.forEach(p => {
       payoutMap[String(p.agent)] = p;
     });


      const enrichedLoans = loans.map(loan => ({
        ...loan,
        controlNumber: controlMap[String(loan._id)] || null,
         // 📱 agent phone
        agentPhone: loan.agent?.user?.phone || null,

        // 💰 payout account
         payoutAccount: payoutMap[String(loan.agent?._id)] || null,

      }));

      return res.json({ loans: enrichedLoans });
    } catch (err) {
      console.log("GET MY LOANS ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch loans." });
    }
  }

  /** =====================================================
   * 3️⃣ CUSTOMER → GET LOANS BY CUSTOMER ID
   * ===================================================== */
  async getLoansByCustomer(req, res) {
    try {
      const customerId = req.params.customerId;
      const userId = req.user.userId || req.user.id || req.user._id;

      if (String(customerId) !== String(userId)) {
        return res.status(403).json({ error: "Access denied." });
      }

      const loans = await Loan.find({ customer: customerId }).sort({
        createdAt: -1,
      });

      return res.json({ loans });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch loans." });
    }
  }
 
    /** =====================================================
   * 4️⃣ AGENT → GET PENDING LOANS
   * ===================================================== */
  async getPendingLoans(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;

      const agent = await Agent.findOne({ user: userId });
      if (!agent) return res.json({ loans: [] });

      const loans = await Loan.find({
        agent: agent._id,
        status: "pending_agent_review",
      })
        .populate("customer", "fullName phone")
        .sort({ createdAt: -1 });

      return res.json({ loans });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch pending loans." });
    }
  }


  /** =====================================================
   * 6️⃣ AGENT → APPROVE LOAN
   * ===================================================== */
  async agentApproveLoan(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;
      const { loanId } = req.params;
      const { items } = req.body;

      const agent = await Agent.findOne({ user: userId });
      if (!agent) {
        return res.status(403).json({ error: "Agent account not found." });
      }

      const result = await loanService.agentApproveLoanWithItems(
        agent._id,
        loanId,
        items
      );

      return res.json(result);
    } catch (err) {
      console.log("Agent Approve Error:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /** =====================================================
   * 🆕 6️⃣➕ AGENT → REJECT LOAN (NEW – SAFE)
   * ===================================================== */
  async agentRejectLoan(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;
      const { loanId } = req.params;
      const { reason } = req.body;

      const agent = await Agent.findOne({ user: userId });
      if (!agent) {
        return res.status(403).json({ error: "Agent account not found." });
      }

      const result = await loanService.agentRejectLoan(
        agent._id,
        loanId,
        reason
      );

      return res.json(result);
    } catch (err) {
      console.log("Agent Reject Error:", err);
      return res.status(400).json({ error: err.message });
    }
  }

  /** =====================================================
   * ⭐ 7️⃣➕ AGENT → GET CUSTOMER DEBTS (LOAN REVIEW)
   * (NEW – SAFE, READ-ONLY)
   * ===================================================== */
  async getCustomerDebtsForLoanReview(req, res) {
    try {
      const userId = req.user.userId || req.user.id || req.user._id;
      const { loanId } = req.params;

      const agent = await Agent.findOne({ user: userId });
      if (!agent) {
        return res.status(403).json({ error: "Agent account not found." });
      }

      const result =
        await loanService.getCustomerDebtsForLoanReview(
          loanId,
          agent._id
        );

      return res.json(result);
    } catch (err) {
      console.log("Loan Review Debts Error:", err);
      return res.status(400).json({ error: err.message });
    }
  }
    
     // ===============================
    // AGENT → GET CUSTOMER DEBTS
     // ===============================
 
  async agentGetLoansWithSnapshot(req, res) {
      try {
        const userId = req.user.userId || req.user.id || req.user._id;

        const agent = await Agent.findOne({ user: userId });
        if (!agent) return res.json({ loans: [] });

        const loans =
          await loanService.getAgentLoansWithSnapshot(agent._id);

        return res.json({ loans });
      } catch (err) {
        return res.status(500).json({ error: "Failed to fetch loans." });
      }
    }
    async getCustomerDebtsForAgent(req, res) {
      try {
       const { systemId } = req.params;

      // 1️⃣ Tafuta mteja kwa systemId
      const user = await User.findOne({ systemId });
      if (!user) {
        return res.status(404).json({ error: "Customer not found" });
     }

    // 2️⃣ Hakiki kama anayefanya request ni agent
    const agent = await Agent.findOne({ user: req.user.userId });
    if (!agent) {
      return res.status(403).json({ error: "Agent not authorized" });
    }

    // 3️⃣ Chukua madeni YOTE ya mteja
    const loans = await Loan.find({
      customer: user._id,
      status: { $in: ["active", "overdue", "pending", "approved"] }
      }).sort({ createdAt: -1 });

      return res.json({ loans });
    } catch (err) {
      console.error("GET CUSTOMER DEBTS ERROR:", err);
      return res.status(500).json({ error: "Failed to fetch customer debts" });
    }
  }
  
   /** =====================================================
 * ⭐ AGENT → GET SINGLE LOAN SNAPSHOT
 * ===================================================== */
async agentGetLoanSnapshot(req, res) {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    const { loanId } = req.params;

    const agent = await Agent.findOne({ user: userId });
    if (!agent) {
      return res.status(403).json({ error: "Agent account not found." });
    }

    const loan = await loanService.getAgentLoanSnapshot(agent._id, loanId);

    if (!loan) {
      return res.status(404).json({ error: "Loan not found." });
    }

    return res.json({ loan });

  } catch (err) {
    console.error("AGENT SNAPSHOT ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch loan." });
  }
}

  /**
 * ======================================================
 * GET CUSTOMER DEBTS (SAFE - READ ONLY)
 * ======================================================
 */
async getCustomerDebts(req, res) {
  try {
    const { customerId } = req.params;

    const loans = await Loan.find({
      customer: customerId,
      status: { $in: ["active", "overdue"] },
    }).sort({ createdAt: -1 });

    return res.json({ loans });
  } catch (err) {
    console.error("GET CUSTOMER DEBTS ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch customer debts" });
  }
}

  /**
   * =====================================================
   * ⭐ ADMIN → GET SINGLE LOAN SNAPSHOT
   * =====================================================
   */
  async adminGetLoanSnapshot(req, res) {
    try {
      const loan = await loanService.getAdminLoanSnapshot(req.params.loanId);
      if (!loan) {
        return res.status(404).json({ error: "Loan not found." });
      }
      return res.json({ loan });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch loan." });
    }
  }
  /**
   * =====================================================
   * ⭐ ADMIN → GET ALL LOANS WITH SNAPSHOT
   * =====================================================
   */
  async adminGetLoansWithSnapshot(req, res) {
    try {
      const loans = await loanService.getAdminLoansWithSnapshot();
      return res.json({ loans });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch loans." });
    }
  }

  /** =====================================================
   * 8️⃣ GET LOAN BY ID
   * ===================================================== */
  async getLoanById(req, res) {
    try {
      const loan = await Loan.findById(req.params.id)
        .populate("customer", "fullName phone")
        .populate("agent", "businessName phone");

      if (!loan) {
        return res.status(404).json({ error: "Loan not found" });
      }

      return res.json({ loan });
    } catch (err) {
      return res.status(500).json({ error: "Failed to fetch loan." });
    }
  }
}

module.exports = new LoanController();


