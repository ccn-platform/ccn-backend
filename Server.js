  require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const cronScheduler = require("./automation/cronScheduler");

// 🔴 IMPORT AWS COLLECTION INIT
const { ensureCollection } = require("./services/biometricService");

// 1️⃣ CONNECT DB
connectDB();

// 2️⃣ CREATE AWS FACE COLLECTION (runs once)
ensureCollection();

// 3️⃣ START AUTOMATION JOBS
cronScheduler.init();

// 4️⃣ START API SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
