 const auditLogsService = require("../services/auditLogsService");
const AuditLog = require("../models/AuditLog");

class AuditLogsController {
  async getAuditLogs(req, res) {
    try {
      const {
        action,
        actorRole,
        targetType,
        targetId,
        loan,
        agent,
        customer,
        limit = 50,
        skip,
        page = 1,
      } = req.query;

      const filter = {};
      if (action) filter.action = action;
      if (actorRole) filter.actorRole = actorRole;
      if (targetType) filter.targetType = targetType;
      if (loan) filter.loan = loan;
      if (agent) filter.agent = agent;
      if (customer) filter.customer = customer;
      if (targetId) filter.targetId = targetId;

      const limitNum = Number(limit);
      const skipNum =
        skip !== undefined
          ? Number(skip)
          : (Number(page) - 1) * limitNum;
 
        if (process.env.NODE_ENV !== "production") {
          console.log("🔍 AUDIT FILTER:", filter);
        }

      // ✅ USE SERVICE (WITH POPULATE)
      const [logs, total] = await Promise.all([
        auditLogsService.getLogs(filter, limitNum, skipNum),
        AuditLog.countDocuments(filter),
      ]);

      return res.json({
        success: true,
        data: logs,
        total,
        page: Number(page),
        limit: limitNum,
      });
    } catch (error) {
      console.error("GET AUDIT LOGS ERROR:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
      });
    }
  }

  async getAuditLogById(req, res) {
    try {
      const { id } = req.params;

      const logs = await auditLogsService.getLogs({ _id: id }, 1, 0);
      if (!logs || logs.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Audit log not found",
        });
      }

      return res.json({
        success: true,
        data: logs[0],
      });
    } catch (error) {
      console.error("GET AUDIT LOG ERROR:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit log",
      });
    }
  }
}

module.exports = new AuditLogsController();
