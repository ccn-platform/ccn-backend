  

 const User = require("../models/User");
const Customer = require("../models/Customer");
const Agent = require("../models/Agent");
const Loan = require("../models/Loan");
const Revenue = require("../models/Revenue");
const BusinessCategory = require("../models/businessCategory");
const ControlNumber = require("../models/controlNumber");
const AuditLog = require("../models/AuditLog");
const Payment = require("../models/payment");
const normalizePhone = require("../utils/normalizePhone");

/**
 * ======================================================
 * 🆕 SAFE AUDIT HELPER (ADD-ONLY)
 * ======================================================
 * - HAIHARIBU kitu chochote
 * - Inaweza kutumika taratibu
 */
async function safeAuditLog({
  action,
  user = null,
  loan = null,
  agent = null,
  customer = null,
  meta = {},
}) {
  try {
    await AuditLog.create({
      action,
      user,
      loan,
      agent,
      customer,
      meta,
    });
  } catch (e) {
    // ⚠️ Audit log must NEVER break main logic
    console.error("AuditLog failed:", e.message);
  }
}

class AdminService {

  /**
   * 1️⃣ BLOCK CUSTOMER USER ACCOUNT
   */
  async blockUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: true },
      { new: true }
    );

    await safeAuditLog({
      action: "ADMIN_BLOCK_USER",
      user: userId,
      customer: userId,
    });

    return user;
  }

  /**
   * 2️⃣ UNBLOCK USER
   */
  async unblockUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isBlocked: false },
      { new: true }
    );

    await safeAuditLog({
      action: "ADMIN_UNBLOCK_USER",
      user: userId,
      customer: userId,
    });

    return user;
  }

  /**
   * 3️⃣ LIST ALL AGENTS
   */
  async getAllAgents() {
    const agents = await Agent.find()
      .populate("user")
      .populate("businessCategory");

    return agents.map(agent => {
      if (agent.phone) agent.phone = normalizePhone(agent.phone);
      return agent;
    });
  }

  /**
   * 4️⃣ APPROVE AGENT ACCOUNT
   */
  async approveAgent(agentId) {
    const agent = await Agent.findByIdAndUpdate(
      agentId,
      { approved: true },
      { new: true }
    );

    await safeAuditLog({
      action: "ADMIN_APPROVE_AGENT",
      agent: agentId,
      user: agent?.user,
    });

    return agent;
  }

  /**
   * 5️⃣ SUSPEND AGENT ACCOUNT
   */
  async suspendAgent(agentId) {
    const agent = await Agent.findByIdAndUpdate(
      agentId,
      { approved: false },
      { new: true }
    );

    await safeAuditLog({
      action: "ADMIN_SUSPEND_AGENT",
      agent: agentId,
      user: agent?.user,
    });

    return agent;
  }

  /**
   * 6️⃣ GET SYSTEM STATS (Dashboard)
   */
  async getSystemStats() {
    const totalCustomers = await Customer.countDocuments();
    const totalAgents = await Agent.countDocuments();

    const activeLoans = await Loan.countDocuments({
      status: { $in: ["approved", "pending_agent_review"] }
    });

    const revenue = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: "$totalFee" } } }
    ]);

    return {
      totalCustomers,
      totalAgents,
      activeLoans,
      totalRevenue: revenue[0]?.total || 0,
    };
  }

  /**
   * 7️⃣ LIST AGENTS BY CATEGORY
   */
  async getAgentsByCategory(categoryId) {
    const agents = await Agent.find({ businessCategory: categoryId })
      .populate("user")
      .populate("businessCategory");

    return agents.map(agent => {
      if (agent.phone) agent.phone = normalizePhone(agent.phone);
      return agent;
    });
  }

  /**
   * 8️⃣ DELETE USER ACCOUNT
   */
  async deleteUser(userId) {
    const user = await User.findByIdAndDelete(userId);

    await safeAuditLog({
      action: "ADMIN_DELETE_USER",
      user: userId,
    });

    return user;
  }

  /**
   * 9️⃣ VIEW ALL CUSTOMERS
   */
  async getAllCustomers() {
    const customers = await Customer.find()
      .populate("user", "fullName phone systemId");

    return customers.map(customer => {
      if (customer.user?.phone) {
        customer.user.phone = normalizePhone(customer.user.phone);
      }
      return customer;
    });
  }

  /**
   * 🔟 GET CUSTOMER DETAILS
   */
  async getCustomerProfile(customerId) {
    const customer = await Customer.findById(customerId)
      .populate("user");

    if (customer?.user?.phone) {
      customer.user.phone = normalizePhone(customer.user.phone);
    }

    return customer;
  }

  /**
   * 1️⃣1️⃣ GET ALL LOANS (ADMIN VIEW)
   */
  async getAllLoans(filters = {}) {
    return await Loan.find(filters)
      .populate("customer")
      .populate("agent")
      .sort({ createdAt: -1 });
  }

  /**
   * 1️⃣2️⃣ GET FULL LOAN DETAILS
   * ✅ FIXED: removed invalid customer.user populate
   */
  async getLoanDetails(loanId) {
    const loan = await Loan.findById(loanId)
      .populate("customer") // ✅ customer has NO user reference
      .populate({
        path: "agent",
        populate: { path: "user", select: "fullName phone" }
      });

    if (!loan) return null;

    const controlNumbers = await ControlNumber.find({ loan: loanId });
    return { loan, controlNumbers };
  }

  /**
   * 1️⃣3️⃣ FORCE CLOSE LOAN
   */
  async forceCloseLoan(loanId, reason) {
    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan haipatikani.");

    loan.status = "force_closed";
    await loan.save();

    await safeAuditLog({
      action: "ADMIN_FORCE_CLOSE_LOAN",
      loan: loanId,
      meta: { reason },
    });

    return loan;
  }

  /**
   * 1️⃣4️⃣ GET OVERDUE / DEFAULTED LOANS
   */
  async getOverdueLoans() {
    return await Loan.find({
      status: { $in: ["overdue", "defaulted"] }
    })
      .populate("customer")
      .populate("agent");
  }

  /**
   * 1️⃣5️⃣ GET REVENUE REPORT
   */
  async getRevenueReport(filters = {}) {
    return await Revenue.aggregate([
      { $match: filters },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalFee" },
          count: { $sum: 1 },
        },
      },
    ]);
  }

  /**
   * 1️⃣6️⃣ GET AUDIT LOGS
   */
  async getAuditLogs(filters = {}) {
    return await AuditLog.find(filters)
      .sort({ createdAt: -1 });
  }

  /**
   * 🚨 DELETE LOAN (HARD DELETE — ADMIN ONLY)
   */
  async deleteLoan(loanId, reason = "Admin delete") {
    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan haipatikani.");

    if (["paid", "overdue", "defaulted"].includes(loan.status)) {
      throw new Error("Loan hii haiwezi kufutwa (imeingia kwenye mzunguko wa fedha).");
    }

    const completedPayment = await Payment.findOne({
      loan: loanId,
      status: "completed",
    });

    if (completedPayment) {
      throw new Error("Loan ina payment iliyokamilika.");
    }

    await ControlNumber.deleteMany({ loan: loanId });
    await Payment.deleteMany({
      loan: loanId,
      status: { $in: ["pending", "failed"] },
    });

    await Loan.findByIdAndDelete(loanId);

    await safeAuditLog({
      action: "ADMIN_DELETE_LOAN",
      loan: loanId,
      meta: { reason },
    });

    return { deleted: true, loanId };
  }
/**
 * 🔍 GET SINGLE AGENT DETAILS (ADMIN)
 */
async getAgentById(agentId) {
  const agent = await Agent.findById(agentId)
    .populate("user")
    .populate("businessCategory");

  if (!agent) return null;

  if (agent.phone) {
    agent.phone = normalizePhone(agent.phone);
  }

  return agent;
}


  /**
   * 🚨 DELETE AGENT (HARD DELETE — ADMIN ONLY)
   * ⚠️ VERY DANGEROUS — guarded carefully
   */
  async deleteAgent(agentId, reason = "Admin emergency delete") {
    const agent = await Agent.findById(agentId);
    if (!agent) {
      throw new Error("Agent haipatikani.");
    }

    const hasLoans = await Loan.exists({ agent: agentId });
    if (hasLoans) {
      throw new Error(
        "Agent hawezi kufutwa kwa sababu ana loans zilizowahi kuhusishwa naye."
      );
    }

    const hasPayments = await Payment.exists({ agent: agentId });
    if (hasPayments) {
      throw new Error(
        "Agent hawezi kufutwa kwa sababu ana malipo yaliyoandikishwa."
      );
    }

    const hasRevenue = await Revenue.exists({ agent: agentId });
    if (hasRevenue) {
      throw new Error(
        "Agent hawezi kufutwa kwa sababu ana rekodi za mapato."
      );
    }

    if (agent.user) {
      await User.findByIdAndDelete(agent.user);
    }

    await Agent.findByIdAndDelete(agentId);

    await safeAuditLog({
      action: "ADMIN_DELETE_AGENT",
      agent: agentId,
      user: agent.user,
      meta: { reason },
    });

    return { deleted: true, agentId };
  }
}

module.exports = new AdminService();
