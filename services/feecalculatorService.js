 // services/feeCalculatorService.js

class FeeCalculatorService {
  constructor() {
    this.feeTable = [
      { min: 100, max: 1000, appFee: 50, approvalFee: 50 },
      { min: 1000, max: 2000, appFee: 100, approvalFee: 100 },
      { min: 2000, max: 3000, appFee: 150, approvalFee: 150 },
      { min: 3000, max: 4000, appFee: 200, approvalFee: 200 },
      { min: 4000, max: 5000, appFee: 250, approvalFee: 200 },
      { min: 5000, max: 7000, appFee: 300, approvalFee: 250 },
      { min: 7000, max: 10000, appFee: 400, approvalFee: 500 },
      { min: 10000, max: 15000, appFee: 500, approvalFee: 700 },
      { min: 15000, max: 20000, appFee: 500, approvalFee: 800 },
      { min: 20000, max: 30000, appFee: 700, approvalFee: 800 },
      { min: 30000, max: 50000, appFee: 1000, approvalFee: 800 },
      { min: 50000, max: 80000, appFee: 1000, approvalFee: 1500 },
      { min: 80000, max: 100000, appFee: 1500, approvalFee: 1500 },
      { min: 100000, max: 150000, appFee: 2500, approvalFee: 2000 },
      { min: 150000, max: 200000, appFee: 2500, approvalFee: 2500 },
      { min: 200000, max: 300000, appFee: 2500, approvalFee: 3000 },
      { min: 300000, max: 500000, appFee: 3000, approvalFee: 3000 },
      { min: 500000, max: 1000000, appFee: 3000, approvalFee: 4000 },
    ];
  }

  /**
   * ======================================================
   * FIXED FEE CALCULATION (NO PERCENTAGE ❌)
   * ======================================================
   */
  calculateTotalLoan(amount) {
    if (!amount || amount <= 0) {
      throw new Error("Kiasi cha mkopo si sahihi.");
    }

    const row = this.feeTable.find(
      r => amount >= r.min && amount <= r.max
    );

    if (!row) {
      throw new Error("Kiasi cha mkopo hakiko kwenye viwango vya ada.");
    }

    const totalFee = row.appFee + row.approvalFee;

    return {
      originalAmount: amount,

      // internal breakdown (customer DOES NOT see this)
      applicationFee: row.appFee,
      approvalFee: row.approvalFee,

      totalFee,
      totalLoanAmount: amount + totalFee,
    };
  }
}

module.exports = new FeeCalculatorService();
