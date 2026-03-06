  const ControlNumber = require("../models/controlNumber");
const Loan = require("../models/Loan");
const AuditLog = require("../models/AuditLog");
const generateReference = require("../utils/generateReference");
const azamPayService = require("./aggregatorService");

class ControlNumberService {

  /**
   * ======================================================
   * 1️⃣ GENERATE OR RETURN EXISTING CONTROL NUMBER
   * ======================================================
   */
  async generateForLoan(loanId) {
  const loan = await Loan.findById(loanId)
.select("_id customer totalPayable status")
.lean();
  if (!loan) throw new Error("Loan haipo.");

  if (loan.status === "paid") {
    throw new Error("Mkopo tayari umelipwa.");
  }

  // ⭐ FAST CHECK
  const existing = await ControlNumber.findOne({
  loan: loan._id,
  status: "active",
})
.select("_id reference amount")
.lean();

  if (existing) {
    return existing;
  }

    /**
     * 🔁 TENGENEZA MPYA (ONLY IF HAKUNA)
     */
    let generatedNumber;
    try {
      generatedNumber = await azamPayService.generateControlNumber({
        amount: loan.totalPayable,
        customer: loan.customer,
        loanId: loan._id,
      });
    } catch (err) {
      generatedNumber = generateReference("CN");
    }
 
    const result = await ControlNumber.findOneAndUpdate(
  {
    loan: loan._id,
    status: "active",
  },
  {
    $setOnInsert: {
      loan: loan._id,
      customer: loan.customer,
      amount: loan.totalPayable,
      reference: generatedNumber,
      status: "active",
    },
  },
  {
    upsert: true,
    new: true,
    rawResult: true,
  }
);

const controlNumber = result.value;
     
if (result?.lastErrorObject?.upserted) {
  await AuditLog.create({
    action: "CONTROL_NUMBER_CREATED",
    loan: loan._id,
    reference: generatedNumber,
  });
}

    return controlNumber;
  }

  /**
   * ======================================================
   * 2️⃣ GET ACTIVE CONTROL NUMBER
   * ======================================================
   */
  async getActiveControl(customerId) {
  return ControlNumber.findOne({
    customer: customerId,
    status: "active",
  })
  .select("reference amount loan createdAt")
  .sort({ createdAt: -1 })
  .lean();
}

  /**
 * ======================================================
 * 🧹 FIX LEGACY CONTROL NUMBERS (OPTIMIZED – NO LOOP)
 * ======================================================
 * - Inafunga control numbers za loans zilizo PAID
 * - Inatumia bulk update (FAST & SCALABLE)
 * - SALAMA kwa production
 */
 async fixLegacyPaidControlNumbers(customerId = null) {

  const query = {
    status: "active"
  };

  if (customerId) {
    query.customer = customerId;
  }

  const controls = await ControlNumber.find(query)
    .select("_id loan")
    .limit(500)
    .lean();

  if (!controls.length) {
    return { fixed: 0 };
  }

  const loanIds = controls.map(c => c.loan);

  const paidLoans = await Loan.find({
    _id: { $in: loanIds },
    status: "paid"
  }).select("_id").lean();

  const paidSet = new Set(paidLoans.map(l => String(l._id)));

  const toUpdate = controls
    .filter(c => paidSet.has(String(c.loan)))
    .map(c => c._id);

  if (!toUpdate.length) {
    return { fixed: 0 };
  }

  const result = await ControlNumber.updateMany(
    { _id: { $in: toUpdate } },
    {
      $set: {
        status: "paid",
        closedAt: new Date(),
      },
    }
  );

  return { fixed: result.modifiedCount };
}
  /**
   * ======================================================
   * 3️⃣ MARK AS PAID (NO CHANGE)
   * ======================================================
   */
 async markAsPaid(loanId) {

  const control = await ControlNumber.findOneAndUpdate(
    {
      loan: loanId,
      status: "active",
    },
    {
      $set: {
        status: "paid",
        paidAt: new Date(),
      },
    },
    {
      new: true,
    }
  );

  if (!control) return null;

  await AuditLog.create({
    action: "CONTROL_NUMBER_PAID",
    loan: loanId,
    reference: control.reference,
  });

  return control;
}
}
module.exports = new ControlNumberService();
