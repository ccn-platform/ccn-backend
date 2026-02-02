// cron/overdueJob.js
const Loan = require("../models/Loan");

async function markOverdueLoans() {
  const now = new Date();

  const overdueLoans = await Loan.updateMany(
    {
      status: "active",
      dueDate: { $lt: now }
    },
    {
      $set: { status: "overdue" }
    }
  );

  console.log("Overdue loans updated:", overdueLoans.modifiedCount);
}

module.exports = markOverdueLoans;
