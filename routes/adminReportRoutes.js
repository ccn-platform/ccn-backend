  const express = require("express");
const router = express.Router();

const adminReportController = require("../controllers/adminReportController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

/**
 * BASE PATH tayari ni:
 * /api/admin/reports
 */

/**
 * JSON REPORT
 */
router.get(
  "/",
  auth,
  role("admin"),
  adminReportController.getEntityReport
);

/**
 * PDF
 */
router.get(
  "/pdf",
  auth,
  role("admin"),
  adminReportController.exportPdf
);

/**
 * CSV
 */
router.get(
  "/csv",
  auth,
  role("admin"),
  adminReportController.exportCsv
);

module.exports = router;
