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

  const activeCount = await ControlNumber.countDocuments({
    customer: customerId,
    status: "active"
  });

  if (activeCount >= 3) {
    return {
      allowed: false,
      reason: "Una madeni zaidi ya 3 lipa  kwanza ili kuendelea kupata huduma  asante",
      code: "TOO_MANY_ACTIVE_CN"
    };
  }

  const overdueExists = await Loan.exists({
    customer: customerId,
    status: "active",
    isOverdue: true
  });

  if (overdueExists) {
    return {
      allowed: false,
      reason: "Una deni ambalo limevuka  muda ulio ahidi kulipa lipa ili kuendelea kupata huduma asante( overdue)",
      code: "OVERDUE_LOAN"
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

if (!eligibility.allowed) {

  try {
    const User = mongoose.model("User");
    const customerUser = await User.findById(customer);

    if (customerUser?.expoPushToken) {
      await pushService.sendTemplate(
        customerUser.expoPushToken,
        "LOAN_BLOCKED",
        {
          reason: eligibility.reason
        }
      );
    }
  } catch (err) {
    console.error("Push notification failed:", err.message);
  }

  throw new Error(eligibility.reason);
}
     
 const User = mongoose.model("User");
const customerUser = await User.findById(customer);

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

  try {

    // notify customer
    if (customerUser?.expoPushToken) {
      await pushService.sendTemplate(
        customerUser.expoPushToken,
        "LOAN_BLOCKED",
        {
          reason: "Una deni overdue au defaulted kwenye category hii"
        }
      );
    }

    // notify agent
    if (agentDoc.user) {
      const agentUser = await User.findById(agentDoc.user);

      if (agentUser?.expoPushToken) {
        await pushService.sendTemplate(
          agentUser.expoPushToken,
          "LOAN_REJECTED",
          { name: "Mteja" }
        );
      }
    }

  } catch (err) {
    console.error("Push error:", err.message);
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

     
    const BusinessCategory = mongoose.model("BusinessCategory");

     
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
 
    const loan = await Loan.findOneAndUpdate(
  {
    _id: loanId,
    status: "pending_agent_review"
  },
  {
    $set: { status: "processing" }
  },
  {
    new: true,
    session
  }
);

    if (!loan) {
      throw new Error("Loan haijapatikana au tayari imeidhinishwa");
    }

    // ======================================================
    // FINAL ELIGIBILITY CHECK
    // ======================================================
    const eligibility = await this.checkBorrowingEligibility(loan.customer);

    if (!eligibility.allowed) {
      await auditLogsService.log({
  action: "LOAN_APPROVAL_BLOCKED",
  actor: agentId,
  actorRole: "agent",
  loan: loan._id,
  agent: loan.agent,
  customer: loan.customer,
  meta: { reason: eligibility.reason, code: eligibility.code },
  source: "SYSTEM",
}).catch(() => {});

      throw new Error(eligibility.reason);
    }

    // ======================================================
    // CALCULATE
    // ======================================================
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const feeData = feeCalculator.calculateTotalLoan(itemsTotal);

    const beforeSnapshot = {
      status: loan.status,
      amount: loan.amount,
    };

    Object.assign(loan, {
      items,
      itemsTotal,
      amount: itemsTotal,
      applicationFee: feeData.applicationFee,
      approvalFee: feeData.approvalFee,
      totalFee: feeData.totalFee,
      totalPayable: feeData.totalLoanAmount,
      principalRemaining: itemsTotal,
      feesRemaining: feeData.totalFee,
      penaltiesRemaining: loan.penaltiesRemaining || 0,
      amountPaid: 0,
      status: "active",
      activatedAt: new Date(),
    });

    await loan.save({ session });

    await Revenue.create([{
      source: "LOAN_FEE",
      totalFee: feeData.totalFee,
      loan: loan._id,
      agent: agentId,
      customer: loan.customer,
    }], { session });

    const controlNumberArr = await ControlNumber.create([{
      loan: loan._id,
      customer: loan.customer,
      agent: loan.agent,
      amount: loan.totalPayable,
      status: "active",
      reference: generateRef("CN"),
    }], { session });

    const controlNumber = controlNumberArr[0];

    await session.commitTransaction();

    // ======================================================
    // LOG + PUSH OUTSIDE TRANSACTION
    // ======================================================
    auditLogsService.log({
      action: "LOAN_APPROVED",
      actor: agentId,
      actorRole: "agent",
      loan: loan._id,
      agent: loan.agent,
      customer: loan.customer,
      before: beforeSnapshot,
      after: { status: loan.status, totalPayable: loan.totalPayable },
      source: "AGENT",
    }).catch(() => {});

    creditHistoryService.onLoanApproved(loan).catch(() => {});

    setImmediate(async () => {
      try {
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
      } catch {}
    });

    return { loan, controlNumber };

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
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
 
async function markOverdueLoans() {
  const now = new Date();
  const BATCH_SIZE = 500;

  while (true) {
    // Chukua batch ndogo tu
    const loans = await Loan.find({
       status: "active",
       isOverdue: false,
       dueDate: { $lt: now }
     })
      .select("_id agent customer") // punguza payload
      .limit(BATCH_SIZE)
      .lean();

    if (!loans.length) break;

    const ids = loans.map(l => l._id);

    // 🔥 Bulk update (haraka sana)
    await Loan.updateMany(
      { _id: { $in: ids } },
      { $set: { isOverdue: true, overdueAt: now } }
    );

    // 🔥 Tengeneza audit logs kwa bulk
    const logs = loans.map(l => ({
      action: "LOAN_MARKED_OVERDUE",
      actor: null,
      actorRole: "system",
      targetType: "Loan",
      targetId: l._id,
      loan: l._id,
      agent: l.agent,
      customer: l.customer,
      before: { isOverdue: false },
      after: { isOverdue: true },
      source: "AUTOMATION",
    }));

    // Hakikisha auditLogsService ina method ya bulk insert
    await auditLogsService.bulkInsert(logs);
  }
}
module.exports = {
  loanService: new LoanService(),
  markOverdueLoans
};
  
