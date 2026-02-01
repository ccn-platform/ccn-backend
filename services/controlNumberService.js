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
    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan haipo.");

    // 🚫 Kama tayari imelipwa, hairuhusiwi
    if (loan.status === "paid") {
      throw new Error("Mkopo tayari umelipwa.");
    }

    /**
     * ✅ RUDISHA CONTROL NUMBER ILIYOPO
     * Hata kama loan ni overdue
     */
    const existing = await ControlNumber.findOne({
      loan: loanId,
      status: "active",
    });

    if (existing) return existing;

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

    const controlNumber = await ControlNumber.create({
      loan: loan._id,
      customer: loan.customer,
      amount: loan.totalPayable,
      reference: generatedNumber,
      status: "active",
    });

    await AuditLog.create({
      action: "CONTROL_NUMBER_CREATED",
      loan: loan._id,
      reference: generatedNumber,
    });

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
    }).sort({ createdAt: -1 });
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
  // 1️⃣ Pata loan IDs zote ambazo ziko PAID
  const paidLoanIds = await Loan.find({ status: "paid" }).distinct("_id");

  if (!paidLoanIds.length) {
    return { fixed: 0 };
  }

  // 2️⃣ Tengeneza query ya control numbers
  const cnQuery = {
    status: "active",
    loan: { $in: paidLoanIds },
  };

  if (customerId) {
    cnQuery.customer = customerId;
  }

  // 3️⃣ Bulk update (NO LOOP)
  const result = await ControlNumber.updateMany(
    cnQuery,
    {
      $set: {
        status: "paid",
        closedAt: new Date(),
      },
    }
  );

  return {
    fixed: result.modifiedCount,
  };
}

  /**
   * ======================================================
   * 3️⃣ MARK AS PAID (NO CHANGE)
   * ======================================================
   */
  async markAsPaid(loanId) {
    const control = await ControlNumber.findOne({
      loan: loanId,
      status: "active",
    });

    if (!control) return null;

    control.status = "paid";
    await control.save();

    await AuditLog.create({
      action: "CONTROL_NUMBER_PAID",
      loan: loanId,
      reference: control.reference,
    });

    return control;
  }
}

module.exports = new ControlNumberService();
 
