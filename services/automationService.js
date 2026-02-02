 // services/automationService.js

const Loan = require("../models/Loan");
const ControlNumber = require("../models/controlNumber");
const riskAssessmentService = require("./riskAssessmentService");

// 🆕 ADD ONLY — Credit History (record only)
const creditHistoryService = require("./creditHistoryService");

class AutomationService {

  /**
   * ======================================================
   * UPDATE LOAN STATUSES (SAFE – PAID LOCKED)
   * ======================================================
   */
  async updateLoanStatuses() {
    console.log("📌 Checking loan statuses...");

    // 🔒 GUSA ACTIVE / OVERDUE TU + DENI HALISI
    const loans = await Loan.find({
      status: { $in: ["active", "overdue"] },
      $or: [
        { principalRemaining: { $gt: 0 } },
        { feesRemaining: { $gt: 0 } },
        { penaltiesRemaining: { $gt: 0 } },
      ],
    });

    const now = new Date();

    for (const loan of loans) {
      // 🔒 FINAL STATE LOCK — MKOPO ULIOKWISHA LIPWA HAUGUSWI
      if (
        loan.principalRemaining <= 0 &&
        loan.feesRemaining <= 0 &&
        loan.penaltiesRemaining <= 0
      ) {
        if (loan.status !== "paid") {
          loan.status = "paid";
          loan.paidAt = loan.paidAt || new Date();
          await loan.save();
        }
        continue; // ⛔ USIFANYE CHOCHOTE ZAIDI
      }

      // 🔁 BADILISHA KUWA OVERDUE IKIWA IMECHELEWA
      if (loan.dueDate && loan.dueDate < now) {
        if (loan.status !== "overdue") {
          loan.status = "overdue";
          loan.overdueAt = loan.overdueAt || new Date();
          await loan.save();

          // 🆕 CREDIT HISTORY — OVERDUE
          await creditHistoryService.onLoanOverdue({
            loanId: loan._id,
            lateDays: Math.floor(
              (now - loan.dueDate) / (1000 * 60 * 60 * 24)
            ),
          });

          // 🔔 NOTIFICATION
          await notificationService.sendSMS(
            loan.customerSnapshot?.phone,
            "Mkopo wako umechelewa kulipwa. Tafadhali lipa haraka."
          );
        }
      }
    }

    console.log("✔ Loan statuses updated safely.");
  }

  /**
   * ======================================================
   * ADD LATE FEES (SAFE – PAID IGNORED)
   * ======================================================
   */
  async addLateFees() {
    console.log("⏳ Applying late fees...");

    const overdueLoans = await Loan.find({
      status: "overdue",
      $or: [
        { principalRemaining: { $gt: 0 } },
        { feesRemaining: { $gt: 0 } },
        { penaltiesRemaining: { $gt: 0 } },
      ],
    });

    for (const loan of overdueLoans) {
      // 🔒 FINAL LOCK
      if (
        loan.principalRemaining <= 0 &&
        loan.feesRemaining <= 0 &&
        loan.penaltiesRemaining <= 0
      ) {
        continue;
      }

      loan.penaltiesRemaining += 500;
      loan.totalPayable += 500;
      await loan.save();

      // 🆕 CREDIT HISTORY — LATE FEE
      await creditHistoryService.recordEvent({
        user: loan.customer,
        loan: loan._id,
        amount: 500,
        eventType: "DEBT_INCREASED",
        description: "Late fee applied",
      });
    }

    console.log("✔ Late fees applied safely.");
  }

   
  

  /**
   * ======================================================
   * AUTO UPDATE RISK (ACTIVE WITH DEBT ONLY)
   * ======================================================
   */
  async autoUpdateRisk() {
    console.log("🧠 Updating risk levels...");

    const loans = await Loan.find({
      status: "active",
      $or: [
        { principalRemaining: { $gt: 0 } },
        { feesRemaining: { $gt: 0 } },
        { penaltiesRemaining: { $gt: 0 } },
      ],
    });

    for (const loan of loans) {
      await riskAssessmentService.evaluate(
        loan.customer,
        loan.agent,
        loan.amount
      );
    }

    console.log("✔ Risk recalculated safely.");
  }
}

module.exports = new AutomationService();
