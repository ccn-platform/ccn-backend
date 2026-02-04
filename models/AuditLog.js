  // models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    /**
     * WHAT HAPPENED
     */
    action: {
      type: String,
      required: true,
      index: true,
    },

    /**
     * WHO DID IT (GENERIC ACTOR)
     */
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorRole: {
      type: String,
      enum: ["admin", "agent", "customer", "system", "automation"],
      default: "system",
      index: true,
    },

    /**
     * TARGET (GENERIC AFFECTED ENTITY)
     */
    targetType: {
      type: String,
      default: null, // e.g. "Loan", "Customer", "Agent"
      index: true,
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    /**
     * OPTIONAL DIRECT REFERENCES (BACKWARD SAFE)
     */
    loan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      default: null,
      index: true,
    },

    controlNumber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ControlNumber",
      default: null,
    },

    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null,
      index: true,
    },

    /**
     * ✅ FIXED: Customer now correctly references User
     * (matches Loan.customer & frontend expectations)
     */
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ✅ THIS IS THE ONLY CHANGE
      default: null,
      index: true,
    },

    /**
     * CHANGE SNAPSHOT (IMPORTANT)
     */
    before: {
      type: Object,
      default: null,
    },

    after: {
      type: Object,
      default: null,
    },

    /**
     * EXTRA DETAILS
     */
    meta: {
      type: Object,
      default: {},
    },

    /**
     * SYSTEM METADATA
     */
    source: {
      type: String,
      enum: ["ADMIN", "SYSTEM", "AGENT", "AUTOMATION"],
      default: "SYSTEM",
      index: true,
    },

    ipAddress: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

/**
 * 🔐 PREVENT UPDATE / DELETE (AUDIT MUST BE IMMUTABLE)
 */
AuditLogSchema.pre(
  ["updateOne", "findOneAndUpdate", "deleteOne", "findOneAndDelete"],
  function () {
    throw new Error("Audit logs are immutable and cannot be modified");
  }
);

/**
 * INDEXES (UNCHANGED)
 */
AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ actor: 1, createdAt: -1 });
AuditLogSchema.index({ targetType: 1, targetId: 1 });
// ➕ ADDED FOR MILLIONS SCALE
AuditLogSchema.index({ loan: 1, action: 1 });
AuditLogSchema.index({ agent: 1, createdAt: -1 }); // optional
module.exports = mongoose.model(
  "AuditLog",
  AuditLogSchema,
  "auditlogs" // 👈 collection name remains EXACT
);
