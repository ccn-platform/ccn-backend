  const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");
const auditLogsRoutes = require("./routes/auditLogsRoutes");

const app = express();
// 🔥 IMPORTANT — DISABLE ETAG GLOBALLY
app.set("etag", false);
// =====================================================
// 1️⃣ SECURITY MIDDLEWARES
// =====================================================
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());

// =====================================================
// 🆕 LEGAL ROUTES (PUBLIC — NO AUTH)
// =====================================================
const legalRoutes = require("./legal/legalRoutes");
app.use("/api/legal", legalRoutes);

// =====================================================
// 2️⃣ RATE LIMITING
// =====================================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: "Too many requests — try again later.",
});
app.use("/api", limiter);

// =====================================================
// 3️⃣ ROUTES
// =====================================================

// ⭐ USER & AUTH
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// ⭐ BUSINESS & AGENTS
app.use("/api/categories", require("./routes/businessCategoryRoutes"));
app.use("/api/agents", require("./routes/agentRoutes"));
// ⭐ PAYOUT ACCOUNTS (AGENT)
app.use("/api", require("./routes/payoutRoutes"));

 const agentFeeRoutes = require("./routes/agentFeeRoutes");
app.use("/api/agent-fees", agentFeeRoutes);

// =====================================================
// 🆕 ADD ONLY — FRONTEND COMPATIBILITY
// =====================================================
// Frontend inaita routes hizi moja kwa moja
// Tunatumia router hiyohiyo (NO DUPLICATION, NO BREAKING)

 
// ⭐ LOANS
app.use("/api/loans", require("./routes/loanRoutes"));

// ⭐ CUSTOMER
app.use("/api/customers", require("./routes/customerRoutes"));
 // ⭐ BIOMETRIC (CUSTOMER ONLY)
app.use("/api/biometric", require("./routes/biometricRoutes"));


// ⭐ AGENT DASHBOARD
app.use("/api/agent", require("./routes/agentDashboardRoutes"));

// ⭐ PAYMENTS
app.use("/api/payments", require("./routes/paymentRoutes"));

// ⭐ REVENUE
app.use("/api/revenue", require("./routes/revenueRoutes"));


// ⭐ ANALYTICS & REPORTS
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/reports", require("./routes/adminReportRoutes"));

// ⭐ RISK ENGINE
app.use("/api/risk", require("./routes/riskRoutes"));

 // ⭐ ADMIN (ORDER IS IMPORTANT)
app.use("/api/admin/audit-logs", auditLogsRoutes);
app.use("/api/admin/reports", require("./routes/adminReportRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// =====================================================
// ⭐ USSD ROUTES
// =====================================================
app.use("/api/ussd", require("./routes/ussdRoutes"));

// =====================================================
// 4️⃣ HEALTH CHECK
// =====================================================
app.get("/", (req, res) => {
  res.send("🔥 CCN Backend API is live & running...");
});

// =====================================================
// 5️⃣ GLOBAL ERROR HANDLER
// =====================================================
 const Logger = require("./services/loggerService");

app.use((err, req, res, next) => {
  Logger.error("UNHANDLED_SERVER_ERROR", {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    user: req.user?.id || null,
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
  });
});

module.exports = app;

