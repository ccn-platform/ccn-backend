const User = require("../models/User");

module.exports = async function deleteAccounts() {
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const users = await User.find({
      deleteRequested: true,
      deleteRequestedAt: { $lte: cutoff },
    });

    for (const user of users) {
      console.log("Deleting user:", user._id);

      await User.findByIdAndDelete(user._id);

      // optional:
      // delete loans
      // delete biometrics
      // delete logs
    }
  } catch (err) {
    console.error("DELETE CRON ERROR:", err);
  }
};
