 require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const cronScheduler = require("./automation/cronScheduler");

// 1️⃣ CONNECT DB
connectDB();

// 2️⃣ START AUTOMATION JOBS
cronScheduler.init();

// 3️⃣ START API SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
