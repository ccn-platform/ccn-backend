  // backend/automation/cronScheduler.js

const cron = require("node-cron");
const dailyAutomation = require("./dailyAutomation");
 
 const { markOverdueLoans } = require("../services/loanService"); 
const riskAutoUpdateJob = require("./riskAutoUpdateJob");

class CronScheduler {
  init() {
    console.log("⏱️ Automation Cron Jobs Started");

    // Daily summaries & cleanup
    cron.schedule("0 0 * * *", () => dailyAutomation.run());

    
// 🔴 Mark overdue loans
cron.schedule("*/5 * * * *", async () => {
  try {

    console.log("🔍 Checking overdue loans...");

    await markOverdueLoans();

    console.log("✔ Overdue loans updated");

  } catch (err) {

    console.error("❌ Overdue Cron Error:", err.message);

  }
});

    // ❌ REMOVED — control numbers should NEVER expire automatically
    // cron.schedule("*/30 * * * *", () => cleanupExpiredControlNumbers.run());

    
    

    // Risk scoring
    cron.schedule("0 1 * * *", () => riskAutoUpdateJob.run());

    console.log("✔ All Cron Jobs Registered (NO CONTROL NUMBER EXPIRY)");
  }
}

module.exports = new CronScheduler();
