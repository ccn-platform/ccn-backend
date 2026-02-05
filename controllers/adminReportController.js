  const adminReportService = require("../services/adminReportService");
const pdfService = require("../services/adminPdfService");
const csvService = require("../services/adminCsvService");
const AuditLog = require("../models/AuditLog");

class AdminReportController {

  /**
   * 🔎 GET REPORT (JSON)
   */
  async getEntityReport(req, res) {
    try {
      const { type, systemId, from, to, page } = req.query;

      if (!type || !systemId) {
        return res.status(400).json({
          success: false,
          message: "type na systemId vinahitajika",
        });
      }

      const report = await adminReportService.buildReport({
        type,
        systemId,
        filters: { from, to, page },
      });

      // 🔐 audit
      await AuditLog.create({
        action: "ADMIN_VIEW_REPORT",
        actor: req.user?._id,
        actorRole: "admin",
        targetType: type,
        meta: { systemId, from, to, page },
        source: "ADMIN",
      });

      return res.json({
        success: true,
        data: report,
      });

    } catch (err) {
      console.error("ADMIN REPORT ERROR:", err.message);
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * 📄 EXPORT PDF
   */
  async exportPdf(req, res) {
    try {
      const { type, systemId, from, to } = req.query;

      const report = await adminReportService.buildReport({
        type,
        systemId,
        filters: { from, to },
      });

      await AuditLog.create({
        action: "ADMIN_EXPORT_PDF",
        actor: req.user?._id,
        actorRole: "admin",
        targetType: type,
        meta: { systemId },
        source: "ADMIN",
      });

      pdfService.generateReportPdf(report, res);

    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /**
   * 📊 EXPORT CSV
   */
  async exportCsv(req, res) {
    try {
      const { type, systemId, from, to } = req.query;

      const report = await adminReportService.buildReport({
        type,
        systemId,
        filters: { from, to },
      });

      await AuditLog.create({
        action: "ADMIN_EXPORT_CSV",
        actor: req.user?._id,
        actorRole: "admin",
        targetType: type,
        meta: { systemId },
        source: "ADMIN",
      });

      csvService.export(report, res);

    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new AdminReportController();
