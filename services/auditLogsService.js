  const AuditLog = require("../models/AuditLog");

/**
 * ==============================
 * SNAPSHOT BUILDER (SAFE)
 * ==============================
 */
function buildSnapshots(payload, meta = {}) {
  const m = { ...meta };

  if (payload.actorUser) {
    m.actorSnapshot = {
      id: payload.actorUser._id,
      fullName: payload.actorUser.fullName,
      email: payload.actorUser.email,
    };
  }

  if (payload.customerUser) {
    m.customerSnapshot = {
      id: payload.customerUser._id,
      fullName: payload.customerUser.fullName,
      phone: payload.customerUser.phone,
    };
  }

  if (payload.agentUser) {
    m.agentSnapshot = {
      id: payload.agentUser._id,
      fullName: payload.agentUser.fullName,
      phone: payload.agentUser.phone,
    };
  }

  return m;
}

class AuditLogsService {

  /**
   * ======================================================
   * CORE AUDIT LOGGER (MILLIONS SAFE)
   * ======================================================
   */
  async log(payload) {
    try {
      const {
        action,
        actor,
        actorRole = "system",
        targetType = null,
        targetId = null,
        loan = null,
        agent = null,
        customer = null,
        controlNumber = null,
        before = null,
        after = null,
        meta = {},
        source = "SYSTEM",
        ipAddress = null,
        userAgent = null,
      } = payload;

      if (!action) return;

      const finalTargetType = targetType ?? (loan ? "Loan" : null);
      const finalTargetId = targetId ?? loan ?? null;

      const metaWithSnapshots = buildSnapshots(payload, meta);

      return await AuditLog.create({
        action,
        actor,
        actorRole,
        targetType: finalTargetType,
        targetId: finalTargetId,
        loan,
        agent,
        customer,
        controlNumber,
        before,
        after,
        meta: metaWithSnapshots,
        source,
        ipAddress,
        userAgent,
      });

    } catch (err) {
      console.error("Audit log failed:", err.message);
      return null; // IMPORTANT: usivunje mfumo
    }
  }

  /**
   * ======================================================
   * BULK INSERT (VERY IMPORTANT)
   * ======================================================
   */
  async bulkInsert(logs) {
  if (!logs || !logs.length) return;

  try {
    return await AuditLog.insertMany(logs, { ordered: false });
  } catch (err) {
    console.error("Audit bulk insert failed:", err.message);
    return null;
  }
}
  /**
   * ======================================================
   * ADMIN READ (FAST VERSION)
   * ======================================================
   */
  async getLogs(filter = {}, limit = 50, skip = 0) {
    return AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

module.exports = new AuditLogsService();
