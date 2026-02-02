 // backend/automation/cronScheduler.js

const cron = require("node-cron");
const dailyAutomation = require("./dailyAutomation");
const loanStatusMonitor = require("./loanStatusMonitor");
 
const riskAutoUpdateJob = require("./riskAutoUpdateJob");

class CronScheduler {
  init() {
    console.log("⏱️ Automation Cron Jobs Started");

    // Daily summaries & cleanup
    cron.schedule("0 0 * * *", () => dailyAutomation.run());

    // 🔁 Check overdue loans
    cron.schedule("*/5 * * * *", () => loanStatusMonitor.run());

    // ❌ REMOVED — control numbers should NEVER expire automatically
    // cron.schedule("*/30 * * * *", () => cleanupExpiredControlNumbers.run());

    
    

    // Risk scoring
    cron.schedule("0 1 * * *", () => riskAutoUpdateJob.run());

    console.log("✔ All Cron Jobs Registered (NO CONTROL NUMBER EXPIRY)");
  }
}

module.exports = new CronScheduler();
