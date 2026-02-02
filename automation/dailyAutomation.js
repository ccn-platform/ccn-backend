 // backend/automation/dailyAutomation.js

const automationService = require("../services/automationService");

class DailyAutomation {
  async run() {
    try {
      console.log("📆 Running Daily Automation...");

     
      await automationService.updateLoanStatuses();
      
      
      await automationService.autoUpdateRisk();
       
      console.log("✔ Daily automation completed.");
    } catch (err) {
      console.error("❌ Daily automation failed:", err.message);
    }
  }
}

module.exports = new DailyAutomation();
