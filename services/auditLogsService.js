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
   * CORE AUDIT LOGGER (HARDENED)
   * ======================================================
   */
  async log(payload) {
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

    if (!action) {
      throw new Error("AuditLog action is required");
    }

    if (["admin", "agent", "customer"].includes(actorRole) && !actor) {
      throw new Error("Actor is required for human actions");
    }

    if (action.startsWith("LOAN_") && !targetId && !loan) {
      throw new Error("Loan audit must reference loan");
    }

    if (before && typeof before !== "object") {
      throw new Error("AuditLog.before must be object");
    }

    if (after && typeof after !== "object") {
      throw new Error("AuditLog.after must be object");
    }

    const finalTargetType = targetType ?? (loan ? "Loan" : null);
    const finalTargetId = targetId ?? loan ?? null;

    const metaWithSnapshots = buildSnapshots(payload, meta);


 return AuditLog.create({
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
  meta: metaWithSnapshots, // ✅ FIXED
  source,
  ipAddress,
  userAgent,
});

  }

  /**
   * ======================================================
   * ADMIN READ-ONLY QUERIES
   * ======================================================
   */
   async getLogs(filter = {}, limit = 50, skip = 0) {
  return AuditLog.find(filter)
    .populate("actor", "fullName email")
    .populate("agent", "fullName phone")
    .populate("customer", "fullName phone")
    .populate({
      path: "loan",
      select: "controlNumber amount status",
      populate: [
        { path: "customer", select: "fullName phone" },
        { path: "agent", select: "fullName phone" },
      ],
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
}

}

module.exports = new AuditLogsService();
