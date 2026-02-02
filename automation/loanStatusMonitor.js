 // backend/automation/loanStatusMonitor.js

const automationService = require("../services/automationService");

class LoanStatusMonitor {
  async run() {
    try {
      console.log("📌 Running Loan Status Monitor...");
      await automationService.updateLoanStatuses();
      console.log("✔ Loan statuses updated.");
    } catch (error) {
      console.error("❌ LoanStatusMonitor Error:", error.message);
    }
  }
}

module.exports = new LoanStatusMonitor();
