// jobs/cleanupBiometric.js
const FaceBiometric = require("../models/FaceBiometric");

async function cleanupBiometrics() {
  await FaceBiometric.deleteMany({
    status: "pending",
    expiresAt: { $lt: new Date() },
  });

  console.log("Expired biometrics cleaned");
}

module.exports = cleanupBiometrics;
