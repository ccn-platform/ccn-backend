  

 
const mongoose = require("mongoose");

const Loan = require("../models/Loan");
const ControlNumber = require("../models/controlNumber");
const Agent = require("../models/Agent");
const AuditLog = require("../models/AuditLog");
const Revenue = require("../models/Revenue");
const Payment = require("../models/payment");
const PayoutAccount = require("../models/payoutAccount");

const splitService = require("./splitService");
const agentPayoutService = require("./agentPayoutService");
const creditHistoryService = require("./creditHistoryService");

/**
 * ======================================================
 * PAYMENT SERVICE
 * ======================================================
 */
class PaymentService {
 /**
 * ======================================================
 * PAY LOAN INSTALLMENT (DIRECT IN-APP PAYMENT)
 * ======================================================
 */
async makePayment({ loanId, customerId, amount }) {
  if (!loanId || !customerId || !amount) {
    throw new Error("Missing required payment details");
  }
const loan = await Loan.findById(loanId);
if (!loan) throw new Error("Loan not found");

 

// 🔹 Hakikisha agent ana payout account ya primary
const payoutAccount = await PayoutAccount.findOne({
  agent: loan.agent,
  isPrimary: true,
  isActive: true,
});

if (!payoutAccount) {
  throw new Error(
    "Agent hana akaunti ya malipo (primary). Tafadhali weka payout account."
  );
}

// 🔒 GUARD — ONGEZA HAPA
if (
  loan.principalRemaining == null ||
  loan.feesRemaining == null
) {
  throw new Error(
    "Loan haijaandaliwa vizuri kwa malipo. Wasiliana na admin."
  );
}

   
  // Hakikisha ni mmiliki wa mkopo
  if (String(loan.customer) !== String(customerId)) {
    throw new Error("Unauthorized payment attempt");
  }

  // Hakikisha bado kuna deni
  if (loan.status === "paid") {
    throw new Error("Loan already fully paid");
  }

    // ⚙️ Gawanya malipo
const split = splitService.splitPayment({
  amountPaid: amount,
  principalRemaining: loan.principalRemaining,
  feesRemaining: loan.feesRemaining,
  penaltiesRemaining: loan.penaltiesRemaining || 0,
});

// 1️⃣ Punguza deni la mkopo
loan.principalRemaining -= split.principalToPay;
loan.feesRemaining -= split.feesToPay;
loan.penaltiesRemaining -= split.penaltiesToPay;
loan.amountPaid += split.totalApplied;

// 2️⃣ Sasisha status ya mkopo
 // ✅ STATUS LOGIC (SAHIHI - LEDGER BASED)
 if (
  loan.principalRemaining <= 0 &&
  loan.feesRemaining <= 0 &&
  loan.penaltiesRemaining <= 0
) {
  loan.status = "paid";
  loan.paidAt = new Date();

  // ✅ HAPA NDIPO UNAWEKA
  await ControlNumber.updateMany(
    {
      loan: loan._id,
      status: "active",
    },
    {
      $set: {
        status: "paid",
        closedAt: new Date(),
      },
    }
  );

} else {
  loan.status = "active";
  if (!loan.activatedAt) {
    loan.activatedAt = new Date();
  }
}


await loan.save();

// 3️⃣ 🏢 ANDIKA MAPATO YA KAMPUNI (ADA)
if (split.feesToPay > 0) {
  await Revenue.create({
     source: "LOAN_FEE",
    amount: split.feesToPay,
    totalFee: split.feesToPay, // muhimu kuzuia error
    loan: loan._id,
    agent: loan.agent,
  });
}

// 4️⃣ 🏪 MLIPIE WAKALA PAPO HAPO
await Agent.findByIdAndUpdate(loan.agent, {
  $inc: { walletBalance: split.principalToPay },
});

// 5️⃣ 💾 Rekodi malipo
 await Payment.create({
  loan: loan._id,
  customer: loan.customer,
  controlNumber: null,

  // ✅ LAZIMA
  amountPaid: split.totalApplied,

  method: "cash",
  status: "completed",

  // ✅ ENUM SAHIHI
  paymentType: split.paymentType, // FULL / PARTIAL / OVERPAYMENT

  reference: `PAY-${Date.now()}`,

  // ✅ GAWANYO LA MALIPO
  appliedBreakdown: {
    principal: split.principalToPay,
    fees: split.feesToPay,
    penalties: split.penaltiesToPay,
  },

  // ✅ SPLIT YA FEDHA
  payout: {
    agentAmount: split.principalToPay, // 🏪 kwa wakala
    companyAmount: split.feesToPay + split.penaltiesToPay, // 🏦 kwa kampuni
    mode: "DIRECT",
  },

  processedAt: new Date(),
});


  return {
  success: true,
  message:
    loan.status === "paid"
      ? "Mkopo umelipwa kikamilifu"
      : "Malipo yamepokelewa, deni limepunguzwa",
};

 }

 /**
 * ======================================================
 * AGENT PAYS LOAN FEE → LOAN CLEARED COMPLETELY
 * ======================================================
 */
async payLoanFee(agentId, loanId, amountPaid) {
  const session = await mongoose.startSession();
session.startTransaction();

try {

  const loan = await Loan.findById(loanId).session(session);
  if (!loan) throw new Error("Mkopo haujapatikana");

  if (String(loan.agent) !== String(agentId)) {
    throw new Error("Huna ruhusa ya mkopo huu");
  }

  if (loan.status === "paid") {
    throw new Error("Mkopo tayari umelipwa");
  }

  if (!["active", "overdue"].includes(loan.status)) {
    throw new Error(
      "Ada inaweza kulipwa tu kwa mkopo ulio ACTIVE au OVERDUE"
    );
  }

  if (loan.feesRemaining == null) {
    throw new Error("Loan haina ledger sahihi ya ada");
  }

  if (Number(amountPaid) !== Number(loan.feesRemaining)) {
    throw new Error(
      `Ada inayotakiwa ni ${loan.feesRemaining}. Partial payment hairuhusiwi.`
    );
  }

  // 🔥 FUTA DENI
  loan.principalRemaining = 0;
  loan.feesRemaining = 0;
  loan.penaltiesRemaining = 0;

  loan.feePaid = true;
  loan.paidFee = amountPaid;

  loan.status = "paid";
  loan.paidAt = new Date();

  await loan.save({ session });

  await ControlNumber.updateMany(
    { loan: loan._id, status: "active" },
    { $set: { status: "paid", closedAt: new Date() } },
    { session }
  );

  await Revenue.create([{
    source: "LOAN_FEE",
    amount: amountPaid,
    totalFee: amountPaid,
    loan: loan._id,
    agent: loan.agent,
  }], { session });

  await Payment.create([{
    loan: loan._id,
    customer: loan.customer,
    amountPaid,
    method: "cash",
    status: "completed",
    paymentType: "FULL",
    reference: `FEE-${Date.now()}`,
    appliedBreakdown: {
      principal: 0,
      fees: amountPaid,
      penalties: 0,
    },
    payout: {
      agentAmount: 0,
      companyAmount: amountPaid,
      mode: "DIRECT",
    },
    processedAt: new Date(),
  }], { session });

  await session.commitTransaction();

  return {
    success: true,
    message: "Ada yote imelipwa, mkopo umefutwa kikamilifu",
  };

} catch (err) {

  await session.abortTransaction();
  throw err;

} finally {

  session.endSession();

}
} 
/**
 * ======================================================
 * AGENT ADJUSTS / SETTLES LOAN (MILLIONS-SCALE READY)
 * ======================================================
 */
async agentAdjustLoan({ agentId, loanId, adjustAmount, reason }) {
  // =========================
  // 🛡️ INPUT VALIDATION
  // =========================
  if (!reason || reason.trim().length < 5) {
    throw new Error("Sababu ya adjustment inahitajika (angalau herufi 5)");
  }

  if (!adjustAmount || isNaN(adjustAmount) || adjustAmount <= 0) {
    throw new Error("Kiasi cha kupunguza si sahihi");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // =========================
    // 🔒 FETCH + LOCK LOAN
    // =========================
    const loan = await Loan.findOne(
      { _id: loanId },
      null,
      { session }
    );

    if (!loan) throw new Error("Loan haipo");

    if (String(loan.agent) !== String(agentId)) {
      throw new Error("Huna ruhusa ya mkopo huu");
    }

    if (loan.status === "paid") {
      throw new Error("Mkopo tayari umelipwa");
    }

    // =========================
    // ⛔ IDEMPOTENCY / RACE GUARD
    // =========================
    if (
      loan.lastAdjustmentAt &&
      Date.now() - loan.lastAdjustmentAt.getTime() < 3000
    ) {
      throw new Error("Adjustment inaendelea, subiri kidogo");
    }

    // =========================
    // 📊 LEDGER VALIDATION
    // =========================
    const principal = Number(loan.principalRemaining || 0);
    const fees = Number(loan.feesRemaining || 0);
    const penalties = Number(loan.penaltiesRemaining || 0);

    const totalRemaining = principal + fees + penalties;

    if (adjustAmount > totalRemaining) {
      throw new Error("Kiasi cha kupunguza kinazidi deni lililopo");
    }

    // =========================
    // 🔥 LEDGER ADJUSTMENT
    // =========================
    let remaining = adjustAmount;

    let penaltiesReduced = 0;
    let feesReduced = 0;
    let principalReduced = 0;

    if (penalties > 0 && remaining > 0) {
      penaltiesReduced = Math.min(penalties, remaining);
      loan.penaltiesRemaining -= penaltiesReduced;
      remaining -= penaltiesReduced;
    }

    if (fees > 0 && remaining > 0) {
      feesReduced = Math.min(fees, remaining);
      loan.feesRemaining -= feesReduced;
      remaining -= feesReduced;
    }

    if (principal > 0 && remaining > 0) {
      principalReduced = Math.min(principal, remaining);
      loan.principalRemaining -= principalReduced;
      remaining -= principalReduced;
    }

    // =========================
    // ✅ FINAL STATUS CHECK
    // =========================
    if (
      loan.principalRemaining <= 0 &&
      loan.feesRemaining <= 0 &&
      loan.penaltiesRemaining <= 0
    ) {
      loan.status = "paid";
      loan.paidAt = new Date();

      await ControlNumber.updateMany(
        { loan: loan._id, status: "active" },
        { $set: { status: "paid", closedAt: new Date() } },
        { session }
      );
    }

    loan.lastAdjustmentAt = new Date();
    await loan.save({ session });

    // =========================
    // 🧾 AUDIT LOG (IMMUTABLE)
    // =========================
     await AuditLog.create(
  [{
    action: "AGENT_LOAN_ADJUSTMENT",
    actor: agentId,
    actorRole: "agent",
    loan: loan._id,
    agent: agentId,
    meta: {
      adjustAmount,
      breakdown: {
        principal: principalReduced,
        fees: feesReduced,
        penalties: penaltiesReduced,
      },
      reason,
    },
    source: "AGENT", // ✅ SAHIHI
  }],
  { session }
);


    // =========================
    // 📊 PAYMENT RECORD (NON-CASH)
    // =========================
    await Payment.create(
      [{
        loan: loan._id,
        customer: loan.customer,
        controlNumber: null,
        amountPaid: adjustAmount,
        method: "adjustment",
        status: "completed",
        paymentType: "ADJUSTMENT",
        reference: `ADJ-${loan._id}-${Date.now()}`,
        appliedBreakdown: {
          principal: principalReduced,
          fees: feesReduced,
          penalties: penaltiesReduced,
        },
        payout: {
          agentAmount: 0,
          companyAmount: 0,
          mode: "NONE",
        },
        processedAt: new Date(),
      }],
      { session }
    );

    // =========================
    // 📈 CREDIT HISTORY (ASYNC SAFE)
    // =========================
    await creditHistoryService.onLoanAdjusted(
      {
        loanId: loan._id,
        agentId,
        amount: adjustAmount,
        breakdown: {
          principal: principalReduced,
          fees: feesReduced,
          penalties: penaltiesReduced,
        },
        reason,
      },
      session
    );

    await session.commitTransaction();

    return {
      success: true,
      message:
        loan.status === "paid"
          ? "Deni limefungwa kikamilifu"
          : "Deni limepunguzwa kwa mafanikio",
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

  /**
   * ======================================================
   * PROCESS MOBILE MONEY PAYMENT
   * ======================================================
   */
  async processPayment(data) {
    const { controlNumber, amountPaid, transactionId } = data;

    const existing = await AuditLog.findOne({ transactionId });
    if (existing) return { message: "Duplicate payment ignored" };

    const control = await ControlNumber.findOne({ reference: controlNumber });
    if (!control) throw new Error("Invalid control number");

    const loan = await Loan.findById(control.loan);
    if (!loan) throw new Error("Loan not found");

    const split = splitService.splitPayment({
      amountPaid,
      principalRemaining: loan.principalRemaining,
      feesRemaining: loan.feesRemaining,
      penaltiesRemaining: loan.penaltiesRemaining || 0,
    });

    loan.principalRemaining -= split.principalToPay;
    loan.feesRemaining -= split.feesToPay;
    loan.penaltiesRemaining -= split.penaltiesToPay;
    loan.amountPaid += split.totalApplied;

      if (
        loan.principalRemaining <= 0 &&
        loan.feesRemaining <= 0 &&
        loan.penaltiesRemaining <= 0
      ) {
        loan.status = "paid";
        loan.paidAt = new Date();

        // ✅ ONGEEZA HAPA
        await ControlNumber.updateMany(
        { loan: loan._id, status: "active" },
        { $set: { status: "paid", closedAt: new Date() } }
      );

      } else {
       // 🔒 USIRUDISHE MKOPO ULIOKWISHA PAID
       if (loan.status !== "paid") {
         loan.status = loan.status === "overdue" ? "overdue" : "active";
      }
    }



       await loan.save();

       if (split.principalToPay > 0) {
         await Agent.findByIdAndUpdate(loan.agent, {
           $inc: { walletBalance: split.principalToPay },
         });
       }


      await Payment.create({
        loan: loan._id,
        customer: loan.customer,
        amount: split.totalApplied,
        paymentType: split.paymentType,
        reference: transactionId,
      });

    await creditHistoryService.onPaymentApplied({
      loanId: loan._id,
      amount: split.totalApplied,
      paymentType: split.paymentType,
    });

    return { success: true };
  }
} 
module.exports = new PaymentService();     
 

 
