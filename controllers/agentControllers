 const agentService = require("../services/agentService");
const Agent = require("../models/Agent");
const Loan = require("../models/Loan");


/**
 * ======================================================
 * INTERNAL HELPER (SAFE + STRONG)
 * ======================================================
 */
async function requireAgentId(req) {
  if (req.user?.agentId) {
    return req.user.agentId;
  }

  const agent = await Agent.findOne({ user: req.user._id });

  if (!agent) {
    const error = new Error(
      "Agent account haijaunganishwa na user aliye-login"
    );
    error.statusCode = 403;
    throw error;
  }

  req.user.agentId = agent._id;
  return agent._id;
}

/* ======================================================
 * EXISTING CONTROLLERS (HAIJAGUSWA)
 * ====================================================== */

exports.createAgent = async (req, res) => {
  try {
    const result = await agentService.createAgentAccount(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.verifyAgent = async (req, res) => {
  try {
    const agent = await agentService.verifyAgentAccount(req.params.agentId);
    res.json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.freezeAgent = async (req, res) => {
  try {
    const agent = await agentService.freezeAgentAccount(
      req.params.agentId,
      req.body.reason
    );
    res.json(agent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyCustomers = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const customers = await agentService.getAgentCustomers(agentId);
    res.json(customers);
  } catch (err) {
    res.status(err.statusCode || 403).json({ message: err.message });
  }
};

exports.getMyLoans = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const loans = await agentService.getAgentLoans(agentId);
    res.json(loans);
  } catch (err) {
    res.status(err.statusCode || 403).json({ message: err.message });
  }
};

exports.requestControlNumber = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const result = await agentService.requestLoanControlNumber(
      agentId,
      req.params.loanId
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getCustomerDebts = async (req, res) => {
  try {
    const { customerId, categoryId } = req.params;
    const debts =
      await agentService.getCustomerDebtsForAgentCategory(
        customerId,
        categoryId
      );
    res.json(debts);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMySubscriptionInfo = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const info = await agentService.getAgentSubscriptionInfo(agentId);
    res.json(info);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyFinancialTotals = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const totals = await agentService.getAgentFinancialTotals(agentId);
    res.json(totals);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyRecentActivity = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const limit = Number(req.query.limit) || 5;

    const activity = await agentService.getAgentRecentActivity(
      agentId,
      limit
    );
    res.json(activity);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getRiskReport = async (req, res) => {
  try {
    const agentId = await requireAgentId(req);
    const report = await agentService.getAgentRiskReport(agentId);

    res.json(
      report || {
        totalLoans: 0,
        active: 0,
        overdue: 0,
        defaulted: 0,
        riskScore: "NO DATA",
      }
    );
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMyLoans = async (req, res) => {
  try {
    const agentId = req.user.agentId;

    const loans = await Loan.find(
      { agent: agentId },
      {
        amount: 1,
        status: 1,
        createdAt: 1,
        dueDate: 1,
        principalRemaining: 1,
        feesRemaining: 1,
        penaltiesRemaining: 1,
      }
    )
      .populate("customer", "fullName phone")
      .sort({ createdAt: -1 });

    res.json(loans);
  } catch (err) {
    console.error("getMyLoans error:", err);
    res.status(400).json({
      message: "Imeshindikana kupata mikopo ya mfanya biashara",
    });
  }
};
