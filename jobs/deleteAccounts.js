  const User = require("../models/User");
const Loan = require("../models/Loan");
const Agent = require("../models/Agent");

module.exports = async function deleteAccounts() {
  try {

    console.log("Running deleteAccounts cron...");

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const users = await User.find(
      {
        deleteRequested: true,
        deleteRequestedAt: { $lte: cutoff },
      },
      "_id role"
    )
    .limit(100)
    .lean();

    let deleted = 0;

    for (const user of users) {

      console.log("Checking user:", user._id);

      // ===============================
      // CUSTOMER CHECK
      // ===============================
      if (user.role === "customer") {

        const hasDebt = await Loan.exists({
          customer: user._id,
          status: {
            $in: [
              "active",
              "overdue",
              "pending_agent_review",
              "approved"
            ]
          }
        });

        if (hasDebt) {
          console.log("Customer has debt, skipping:", user._id);
          continue;
        }
      }

      // ===============================
      // AGENT CHECK
      // ===============================
      if (user.role === "agent") {

        const agent = await Agent.findOne({ user: user._id })
          .select("_id")
          .lean();

        if (agent) {

          const activeLoans = await Loan.exists({
            agent: agent._id,
            status: {
              $in: [
                "active",
                "overdue",
                "pending_agent_review",
                "approved"
              ]
            }
          });

          if (activeLoans) {
            console.log("Agent has loans, skipping:", user._id);
            continue;
          }

          await Agent.deleteOne({ user: user._id });
        }
      }

      // ===============================
      // DELETE USER
      // ===============================
      console.log("Deleting user:", user._id);

      await User.deleteOne({ _id: user._id });

      deleted++;
    }

    console.log("Deleted accounts:", deleted);

  } catch (err) {
    console.error("DELETE CRON ERROR:", err);
  }
};
