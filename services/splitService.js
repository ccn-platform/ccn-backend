 // services/splitService.js

class SplitService {
  /**
   * =====================================================
   * SAFE LEDGER-BASED SPLIT (FINANCIAL GRADE)
   *
   * Order of payment:
   * 1️⃣ Penalties
   * 2️⃣ Fees
   * 3️⃣ Principal
   *
   * Rules:
   * - Hakuna proportional split ❌
   * - Hakuna kulipa zaidi ya kilichobaki ❌
   * - Hakuna kulipa zaidi ya amountPaid ❌
   * =====================================================
   */
  splitPayment({
    amountPaid,
    principalRemaining,
    feesRemaining,
    penaltiesRemaining = 0,
  }) {
    let remaining = amountPaid;

    let penaltiesToPay = 0;
    let feesToPay = 0;
    let principalToPay = 0;

    // 1️⃣ Penalties
    if (remaining > 0 && penaltiesRemaining > 0) {
      penaltiesToPay = Math.min(remaining, penaltiesRemaining);
      remaining -= penaltiesToPay;
    }

    // 2️⃣ Fees
    if (remaining > 0 && feesRemaining > 0) {
      feesToPay = Math.min(remaining, feesRemaining);
      remaining -= feesToPay;
    }

    // 3️⃣ Principal
    if (remaining > 0 && principalRemaining > 0) {
      principalToPay = Math.min(remaining, principalRemaining);
      remaining -= principalToPay;
    }

    const totalApplied =
      penaltiesToPay + feesToPay + principalToPay;

    // 🧠 Payment type
    let paymentType = "PARTIAL";
    if (
      principalRemaining - principalToPay <= 0 &&
      feesRemaining - feesToPay <= 0 &&
      penaltiesRemaining - penaltiesToPay <= 0
    ) {
      paymentType = "FULL";
    } else if (remaining > 0) {
      paymentType = "OVERPAYMENT";
    }

    return {
      paymentType,
      penaltiesToPay,
      feesToPay,
      principalToPay,
      totalApplied,
      overpaymentAmount: remaining > 0 ? remaining : 0,
    };
  }
}

module.exports = new SplitService();
