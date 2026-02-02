 // backend/automation/lateFeeJob.js

const automationService = require("../services/automationService");

class LateFeeJob {
  async run() {
    try {
      console.log("⏳ Running Late Fee Job...");
      await automationService.addLateFees();
      console.log("✔ Late fee added successfully.");
    } catch (error) {
      console.error("❌ LateFeeJob Error:", error.message);
    }
  }
}

module.exports = new LateFeeJob();
