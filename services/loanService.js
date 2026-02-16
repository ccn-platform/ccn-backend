    const mongoose = require("mongoose");

const Loan = require("../models/Loan");
const ControlNumber = require("../models/controlNumber");
const Agent = require("../models/Agent");
const auditLogsService = require("./auditLogsService");

const Revenue = require("../models/Revenue");
const feeCalculator = require("./feecalculatorService");
const generateReference = require("../utils/generateReference");
const normalizePhone = require("../utils/normalizePhone");
const agentService = require("./agentService");

// 🆕 ADD ONLY: Push Service (SAFE)
const pushService = require("./pushService");

// 🆕 ADD ONLY: Credit History Hook (SAFE)
const creditHistoryService = require("./creditHistoryService");

/**
 * ======================================================
 * SAFE REFERENCE GENERATOR
 * ======================================================
 */
function generateRef(prefix) {
  if (prefix === "LN") return generateReference.loanReference();
  if (prefix === "CN") return generateReference.controlNumber();
  if (prefix === "TX") return generateReference.transactionId();
  return generateReference.randomCode(10);
}

class LoanService {
  /**
   * ======================================================
   * 1️⃣ BORROWING ELIGIBILITY
   * ======================================================
   */
  async checkBorrowingEligibility(customerId) {
     const activeControls = await ControlNumber.find({
  customer: customerId,
  status: "active",
}).populate("loan");

// 🚨 HESABU TU ZENYE LOAN AMBAZO SIO PAID
const unpaidControls = activeControls.filter(
  cn => cn.loan && cn.loan.status !== "paid"
);

if (unpaidControls.length >= 3) {
  return {
    allowed: false,
    reason: "Una madeni zaidi ya 3 ambayo bado  hayajalipwa  lipa  ili  kuendelea  kupata huduma  asante.",
    code: "TOO_MANY_ACTIVE_CN",
  };
}


     const overdueLoan = await Loan.findOne({
       customer: customerId,
       status: "active",
       isOverdue: true,
     });

    if (overdueLoan) {
      return {
        allowed: false,
        reason: "Una deni ambalo limepita muda wa kulipa. Lipa sasa ili uendelee kupata huduma.",
        code: "OVERDUE_LOAN",
      };
    }


    return { allowed: true };
  }

  /**
   * ======================================================
   * 2️⃣ CREATE LOAN REQUEST
   * ======================================================
   */
  async createLoanRequest({ customer, agent, items, repaymentPeriod }) {
    if (!agent) throw new Error("Agent ID inahitajika.");
    if (!repaymentPeriod || repaymentPeriod < 1)
      throw new Error("Weka muda sahihi wa kulipa mkopo.");
    if (!items || !Array.isArray(items) || items.length === 0)
      throw new Error("Ongeza bidhaa angalau moja.");

    const eligibility = await this.checkBorrowingEligibility(customer);
    if (!eligibility.allowed) throw new Error(eligibility.reason);

      
    const agentDoc = await Agent.findById(agent);
    if (!agentDoc) throw new Error("Wakala hakupatikana.");

    const categoryId = agentDoc.businessCategory;

    const debtResult =
      await agentService.getCustomerDebtsForAgentCategory(
        customer,
        categoryId
      );

    const hasProblem = debtResult.debts.some(
      (d) => d.status === "overdue" || d.status === "defaulted"
    );

    if (hasProblem) {
      // 🔔 PUSH → AGENT (LOAN BLOCKED)
      if (agentDoc.user) {
        const User = mongoose.model("User");
        const agentUser = await User.findById(agentDoc.user);

        if (agentUser?.expoPushToken) {
          await pushService.sendTemplate(
            agentUser.expoPushToken,
            "LOAN_REJECTED",
            { name: "Mteja" }
          );
        }
      }

      return {
        loanCreated: false,
        requiresAgentReview: true,
        message: "Mteja ana deni lililo overdue/defaulted.",
        debts: debtResult.debts,
        summary: debtResult.summary,
      };
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + repaymentPeriod);

    const User = mongoose.model("User");
    const BusinessCategory = mongoose.model("BusinessCategory");

    const customerUser = await User.findById(customer);
    const agentUser = agentDoc.user
      ? await User.findById(agentDoc.user)
      : null;

    const categoryDoc = categoryId
      ? await BusinessCategory.findById(categoryId)
      : null;

    const loan = await Loan.create({
      customer,
      agent,
      agentCategory: categoryId,

      agentSnapshot: {
        agentId: agentDoc.agentId || agentDoc.systemId || null,
        fullName: agentUser?.fullName || null,
        phone: agentUser?.phone || null,
        businessName: agentDoc.businessName || null,
        categoryName: categoryDoc?.name || null,
      },

      customerSnapshot: {
        customerId: customerUser?.systemId || null,
        fullName: customerUser?.fullName || null,
        phone: customerUser?.phone || null,
        phoneNormalized: customerUser?.phone
          ? normalizePhone(customerUser.phone)
          : null,
      },

      items,
      itemsTotal: 0,
      amount: 0,
      dueDate,
      status: "pending_agent_review",
      applicationFee: 0,
      approvalFee: 0,
      totalFee: 0,
      totalPayable: 0,
      amountPaid: 0,
      reference: generateRef("LN"),
      repaymentPeriod,
    });


 await auditLogsService.log({
  action: "LOAN_REQUEST_CREATED",

  actor: customer,
  actorRole: "customer",

  targetType: "Loan",
  targetId: loan._id,

  loan: loan._id,
  agent,
  customer,

  meta: {
    orderSnapshot: {
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      })),
      itemsCount: items.length,
      repaymentPeriod,
      dueDate,
    },
  },

  source: "SYSTEM",
});



    return { loanCreated: true, loan };
  }

  /**
   * ======================================================
   * 3️⃣ AGENT APPROVE LOAN
   * ======================================================
   */
  async agentApproveLoanWithItems(agentId, loanId, items) {
  const loan = await Loan.findById(loanId);
  if (!loan) throw new Error("Loan haijapatikana");
 /**
 * ======================================================
 * 🔒 FINAL ELIGIBILITY CHECK (BEFORE APPROVAL)
 * ======================================================
 * - Inazuia agent ku-approve mkopo kama mteja
 *   ana madeni matatu (3) au zaidi ambayo hayajalipwa
 */
const eligibility = await this.checkBorrowingEligibility(loan.customer);

if (!eligibility.allowed) {
  // 🧾 AUDIT LOG — APPROVAL BLOCKED
  await auditLogsService.log({
    action: "LOAN_APPROVAL_BLOCKED",

    actor: agentId,
    actorRole: "agent",

    targetType: "Loan",
    targetId: loan._id,

    loan: loan._id,
    agent: loan.agent,
    customer: loan.customer,

    meta: {
      reason: eligibility.reason,
      code: eligibility.code, // e.g. TOO_MANY_ACTIVE_LOANS
    },

    source: "SYSTEM",
  });

  // 🚨 MESSAGE ITAKAYOENDA FRONTEND / AGENT
  throw new Error(
    eligibility.reason ||
      "Mteja tayari ana madeni matatu (3) ambayo bado hayajalipwa. " +
        "Lazima alipe angalau deni moja kabla ya kuidhinisha mkopo mpya."
  );
}


  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const feeData = feeCalculator.calculateTotalLoan(itemsTotal);

  /**
   * ======================================================
   * ✅ SAFE LEDGER INITIALIZATION (NO BREAKING CHANGES)
   * ======================================================
   * - Hii ndiyo chanzo cha ukweli wa malipo
   * - PaymentService + splitService hutegemea fields hizi
   */
  const beforeSnapshot = {
    status: loan.status,
    amount: loan.amount,
  };

  Object.assign(loan, {
    // 📦 Items
    items,
    itemsTotal,

    // 💰 Amounts
    amount: itemsTotal,
    applicationFee: feeData.applicationFee,
    approvalFee: feeData.approvalFee,
    totalFee: feeData.totalFee,
    totalPayable: feeData.totalLoanAmount,

    // 📊 LEDGER (MUHIMU SANA)
    principalRemaining: itemsTotal,
    feesRemaining: feeData.totalFee,
    penaltiesRemaining: loan.penaltiesRemaining || 0,
    amountPaid: 0,

    // 📌 STATUS
    status: "active",
    activatedAt: new Date(),
  });

  await loan.save();
  
  await Revenue.create({
  source: "LOAN_FEE",
  totalFee: feeData.totalFee,   // ADA HALISI YA MKOPO
  loan: loan._id,
  agent: agentId,
  customer: loan.customer,
});

   await auditLogsService.log({
  action: "LOAN_APPROVED",

  actor: agentId,
  actorRole: "agent",

  targetType: "Loan",
  targetId: loan._id,

  loan: loan._id,
  agent: loan.agent,
  customer: loan.customer,

  // ======================
  // STATUS SNAPSHOT
  // ======================
  before: beforeSnapshot,

  after: {
    status: loan.status,
    amount: loan.amount,
    itemsTotal,
    applicationFee: feeData.applicationFee,
    approvalFee: feeData.approvalFee,
    totalFee: feeData.totalFee,
    totalPayable: loan.totalPayable,
    activatedAt: loan.activatedAt,
  },

  // ======================
  // ORDER SNAPSHOT (FINAL)
  // ======================
  meta: {
    orderSnapshot: {
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        total: i.price * i.quantity,
      })),

      itemsCount: items.length,
      itemsTotal,

      applicationFee: feeData.applicationFee,
      approvalFee: feeData.approvalFee,
      totalFee: feeData.totalFee,

      totalPayable: loan.totalPayable,
      repaymentPeriod: loan.repaymentPeriod,
      dueDate: loan.dueDate,
    },
  },

  source: "AGENT",
});

  // 🔗 CREDIT HISTORY (HAIGUSWI)
  await creditHistoryService.onLoanApproved(loan);

  // 🔢 CONTROL NUMBER (KAMA ULIVYOKUWA)
  const controlNumber = await ControlNumber.create({
    loan: loan._id,
    customer: loan.customer,
    agent: loan.agent,
    amount: loan.totalPayable,
    status: "active",
    reference: generateRef("CN"),
  });

  // 🔔 NOTIFICATION (KAMA ILIVYOKUWA)
  const User = mongoose.model("User");
  const customerUser = await User.findById(loan.customer);

  if (customerUser?.expoPushToken) {
    await pushService.sendTemplate(
      customerUser.expoPushToken,
      "CONTROL_NUMBER",
      {
        cn: controlNumber.reference,
        amount: loan.totalPayable,
      }
    );
  }

  return { loan, controlNumber };
}


  /**
   * ======================================================
   * 🆕 4️⃣ REQUEST LOAN BY PHONE (SAFE FIX)
   * ======================================================
   */
  async requestLoanByPhone(formData, customerId) {
    let agent = null;

    // ✅ PRIMARY: Agent ID (ObjectId)
    if (formData.agentId && mongoose.Types.ObjectId.isValid(formData.agentId)) {
      agent = await Agent.findById(formData.agentId);
    }

    // ⭐ SAFE ADD ONLY — SUPPORT OLD + NEW AGENTS
    if (!agent && formData.agentPhone) {
      const normalizedPhone = normalizePhone(formData.agentPhone);

      agent = await Agent.findOne({
        $or: [
          { normalizedPhone },             // 🆕 AGENT WAPYA
          { phone: normalizedPhone },      // BACKWARD COMPATIBLE
          { phone: formData.agentPhone },  // VERY OLD DATA
        ],
      });
    }

    if (!agent) {
      throw new Error("Agent ID au Agent Phone inahitajika.");
    }

    return this.createLoanRequest({
      customer: customerId,
      agent: agent._id,
      items: formData.items,
      repaymentPeriod: formData.repaymentPeriod,
    });
  }

  /**
   * ======================================================
   * 🆕 5️⃣ GET CUSTOMER DEBTS FOR LOAN REVIEW
   * ======================================================
   */
  async getCustomerDebtsForLoanReview(loanId, agentId) {
    const loan = await Loan.findById(loanId);

    if (!loan) throw new Error("Loan haipo.");
    if (String(loan.agent) !== String(agentId))
      throw new Error("Huna ruhusa ya kuona madeni haya.");
    if (loan.status !== "pending_agent_review")
      throw new Error("Loan haiko kwenye hatua ya mapitio.");

    return agentService.getCustomerDebtsForAgentCategory(
      loan.customer,
      loan.agentCategory
    );
  }

  /**
   * ======================================================
   * 🆕 6️⃣ AGENT REJECT LOAN
   * ======================================================
   */
  async agentRejectLoan(agentId, loanId, reason = null) {
    const loan = await Loan.findById(loanId);

    if (!loan) throw new Error("Loan haipo.");
    if (String(loan.agent) !== String(agentId))
      throw new Error("Huna ruhusa ya loan hii.");
    if (loan.status !== "pending_agent_review")
      throw new Error("Loan tayari imefanyiwa maamuzi.");

    loan.status = "rejected";
    await loan.save();

     await auditLogsService.log({
       action: "LOAN_REJECTED",

       actor: agentId,
       actorRole: "agent",

       targetType: "Loan",
       targetId: loan._id,

       loan: loan._id,
       agent: loan.agent,
       customer: loan.customer,

       after: {
  status: loan.status,
},
        meta: { reason },


       source: "AGENT",
     });


    const User = mongoose.model("User");
    const customerUser = await User.findById(loan.customer);

    if (customerUser?.expoPushToken) {
      await pushService.sendTemplate(
        customerUser.expoPushToken,
        "LOAN_REJECTED",
        {
          name: loan.customerSnapshot?.fullName || "Mteja",
        }
      );
    }

    return { rejected: true, loan };
  }
}
 /**
 * ======================================================
 * 🆕 AUTO MARK OVERDUE LOANS (SAFE VERSION)
 * ======================================================
 * - HAIBADILISHI status ya loan
 * - Inahifadhi history ya overdue
 * - Inaruhusu malipo kuendelea
 */
async function markOverdueLoans() {
  const now = new Date();

  const loans = await Loan.find({
     status: "active",
    dueDate: { $lt: now },
    isOverdue: { $ne: true }, // avoid repeat
  });

  for (const loan of loans) {
    loan.isOverdue = true;
    loan.overdueAt = now;

    // HATUBADILISHI STATUS
    // loan.status remains "approved"

    await loan.save();
    await auditLogsService.log({
      action: "LOAN_MARKED_OVERDUE",

      actor: null,
      actorRole: "system",

      targetType: "Loan",
      targetId: loan._id,

      loan: loan._id,
      agent: loan.agent,
      customer: loan.customer,

      before: { isOverdue: false },
      after: { isOverdue: true },

      source: "AUTOMATION",
   });

  }
}

module.exports = new LoanService();
  
