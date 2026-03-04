require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const cronScheduler = require("./automation/cronScheduler");

const { ensureCollection } = require("./services/biometricService");

const cleanupBiometrics = require("./jobs/cleanupBiometric");
const deleteAccounts = require("./jobs/deleteAccounts");

const mongoose = require("mongoose");

async function startServer() {
  try {
    
    // 1️⃣ CONNECT DATABASE
    await connectDB();

    // 2️⃣ CREATE AWS FACE COLLECTION
    await ensureCollection();

    // 3️⃣ START CRON JOBS
    cronScheduler.init();

    // 4️⃣ BACKGROUND CLEANUPS
    setInterval(cleanupBiometrics, 5 * 60 * 1000);
    setInterval(deleteAccounts, 60 * 60 * 1000);

    // 5️⃣ START SERVER
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
}

startServer();

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Closing server...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

