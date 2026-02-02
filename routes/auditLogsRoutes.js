 // routes/auditLogsRoutes.js

const express = require("express");
const router = express.Router();

const auditLogsController = require("../controllers/auditLogsController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/**
 * ======================================================
 * ADMIN ONLY — AUDIT LOGS
 * ======================================================
 */

// 🔐 GET ALL AUDIT LOGS (CACHE + ETAG DISABLED — FINAL FIX)
router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  (req, res, next) => {
    /**
     * 🚫 DISABLE ALL HTTP CACHING
     * - Prevents 304 Not Modified
     * - Required for real-time audit visibility
     * - Safe (read-only endpoint)
     */
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    /**
     * 🚨 IMPORTANT: KILL ETAG FOR THIS RESPONSE ONLY
     * (This is the root cause of persistent 304s)
     */
    res.removeHeader("ETag");

    next();
  },
  auditLogsController.getAuditLogs
);

// 🔐 GET SINGLE AUDIT LOG BY ID (UNCHANGED, SAFE)
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  auditLogsController.getAuditLogById
);

module.exports = router;
