  const mongoose = require("mongoose");
const normalizePhone = require("../utils/normalizePhone");
const Loan = require("../models/Loan");
const Payment = require("../models/payment");
const AuditLog = require("../models/AuditLog");
const Agent = require("../models/Agent");
const User = require("../models/User");
const FaceBiometric = require("../models/FaceBiometric");
const ControlNumber = require("../models/controlNumber");

 

/**
 * ======================================================
 * ADMIN REPORT SERVICE
 * ======================================================
 * READ-ONLY • AUDIT-SAFE • PDF-READY
 */
class AdminReportService {
  /**
   * ======================================================
   * 🔎 RESOLVE ENTITY (AGENT / CUSTOMER)
   * ======================================================
   */
   
 async resolveEntity({ type, systemId }) {
  if (!type || !systemId) {
    throw new Error("type na systemId vinahitajika");
  }

  let query = [];

  // normalize phone kama inaonekana ni phone
  let normalizedPhone = null;

  if (/^\+?\d+$/.test(systemId)) {
    normalizedPhone = normalizePhone(systemId);
  }

  // kama ni ObjectId halali
  if (mongoose.Types.ObjectId.isValid(systemId)) {
    query.push({ _id: systemId });
  }

  if (type === "agent") {
    query.push({ agentId: systemId });

    if (normalizedPhone) {
     query.push({ phone: normalizedPhone });
     query.push({ phoneNormalized: normalizedPhone });

    }

    const agent = await Agent.findOne({ $or: query });

    if (!agent) throw new Error("Agent hajapatikana");

    return { entityType: "AGENT", entity: agent };
  }

  if (type === "customer") {
    query.push({ customerId: systemId });

    if (normalizedPhone) {
      query.push({ phone: normalizedPhone });
      query.push({ normalizedPhone });
    }

    const customer = await User.findOne({ $or: query });

    if (!customer) throw new Error("Customer hajapatikana");

    return { entityType: "CUSTOMER", entity: customer };
  }

  throw new Error("Aina ya utafutaji si sahihi");
}

 
  /**
   * ======================================================
   * 📊 BUILD FULL REPORT
   * ======================================================
   */
  
   async buildReport({ type, systemId, filters = {} })
{
    const { entityType, entity } = await this.resolveEntity({ type, systemId });
    /**
   * ======================================================
   * 🔵 LOAD AGENT WITH CATEGORY (IMPORTANT FIX)
   * ======================================================
   */
  let populatedAgent = null;

  if (entityType === "AGENT") {
    populatedAgent = await Agent.findById(entity._id)
      .populate("businessCategory", "name");
  }

    const entityProfile =
  entityType === "AGENT"
    ? {
        id: populatedAgent?._id,
        agentId: populatedAgent?.agentId,
        name: populatedAgent?.fullName,
        phone: populatedAgent?.phone,

        businessName: populatedAgent?.businessName || null,
        businessCategory:
          populatedAgent?.businessCategory?.name || null,
      }
    : {
        id: entity._id,
        customerId: entity.customerId,
        name: entity.fullName,
        phone: entity.phone,
      };

 
     
      /**
 * ======================================================
 * 🔐 SECURITY / BIOMETRIC PROFILE
 * ======================================================
 */

let biometric = null;

if (entityType === "CUSTOMER") {
  biometric = await FaceBiometric.findOne({ userId: entity._id });
}

const securityProfile = {
  nidaNumber: entity.nationalId || null,
  phoneNormalized: entity.phoneNormalized || null,

  faceRegistered: biometric ? true : false,
  faceStatus: biometric?.status || "none",
  livenessScore: biometric?.livenessScore || null,
  faceRegisteredAt: biometric?.createdAt || null,
};

    /**
     * ======================================================
     * 🔐 REGISTRATION SNAPSHOT (VERY IMPORTANT)
     * ======================================================
     */
    const registrationAudit = await AuditLog.findOne({
      
      action:
        entityType === "AGENT"
          ? "AGENT_SELF_REGISTERED"
          : "CUSTOMER_SELF_REGISTERED",
      actor: entity._id,
    }).sort({ createdAt: 1 });

    const registrationSnapshot = {
      method: "SELF",
      registeredAt: entity.createdAt,
      firstSeenInSystem: registrationAudit?.createdAt || entity.createdAt,
      registeredBy: "SELF",
      initialStatus: registrationAudit?.meta?.initialStatus || "active",
      currentStatus: entity.status || "active",
    };

    /**
     * ======================================================
     * 🔎 QUERY BUILDING
     * ======================================================
     */
    const loansQuery =
      entityType === "AGENT"
        ? { agent: entity._id }
        : { customer: entity._id };

     const paymentsQuery =
       entityType === "AGENT"
         ? { agent: entity._id }
         : { customer: entity._id };

    const auditQuery =
      entityType === "AGENT"
        ? { agent: entity._id }
        : { customer: entity._id };
// 📅 DATE FILTER SUPPORT
if (filters?.from || filters?.to) {
  const dateFilter = {};

  if (filters.from) dateFilter.$gte = new Date(filters.from);
  if (filters.to) dateFilter.$lte = new Date(filters.to);

  loansQuery.createdAt = dateFilter;
  paymentsQuery.createdAt = dateFilter;
  auditQuery.createdAt = dateFilter;
}

    /**
     * ======================================================
     * 1️⃣ LOANS
     * ======================================================
     */
    const loans = await Loan.find(loansQuery)
      .populate("customer", "fullName phone")
      .populate("agent", "fullName agentId")
      .sort({ createdAt: 1 });

    /**
     * ======================================================
     * 2️⃣ PAYMENTS
     * ======================================================
     */
    const payments = await Payment.find(paymentsQuery)
      .populate("loan")
      .sort({ createdAt: 1 });

    /**
     * ======================================================
     * 3️⃣ AUDIT LOGS
     * ======================================================
     */
    const auditLogs = await AuditLog.find(auditQuery).sort({ createdAt: 1 });

    const statusSnapshot = {

      isActive: entity.status !== "blocked",
      currentStatus: entity.status || "active",
      flagged: auditLogs.some(
      l =>
        l.action.includes("BLOCK") ||
        l.action.includes("SUSPEND")
     ),
   };

   const behaviorMetrics = {
     adjustmentCount: auditLogs.filter(
       l => l.action === "AGENT_LOAN_ADJUSTMENT"
     ).length,

      blockedEvents: auditLogs.filter(
      l => l.action.includes("BLOCK")
    ).length,

     suspendedEvents: auditLogs.filter(
     l => l.action.includes("SUSPEND")
    ).length,
  };

    /**
     * ======================================================
     * 4️⃣ CONTROL NUMBERS
     * ======================================================
     */
    const controlNumbers = await ControlNumber.find(loansQuery).sort({
      createdAt: 1,
    });

    /**
     * ======================================================
     * 📈 SUMMARY
     * ======================================================
     */
    let totalLoans = loans.length;
    let paidLoans = 0;
    let unpaidLoans = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;

    loans.forEach((loan) => {
      const remaining =
        (loan.principalRemaining || 0) +
        (loan.feesRemaining || 0) +
        (loan.penaltiesRemaining || 0);

      if (loan.status === "paid") {
        paidLoans++;
      } else {
        unpaidLoans++;
        totalOutstanding += remaining;
      }
    });

    payments.forEach((p) => {
      totalCollected += p.amountPaid || 0;
    });

    /**
     * ======================================================
     * 🧾 TIMELINE (SCAN & PDF FRIENDLY)
     * ======================================================
     */
    const timeline = [];

    timeline.push({
      date: registrationSnapshot.firstSeenInSystem,
      type: "REGISTRATION",
      actorType: entityType,
      actorId: entity._id,
      meta: registrationSnapshot,
    });

    loans.forEach((loan) =>
      timeline.push({
        date: loan.createdAt,
        type: "LOAN_CREATED",
        loanId: loan._id,
        amount: loan.amount,
        status: loan.status,
      })
    );

    payments.forEach((p) =>
      timeline.push({
        date: p.createdAt,
        type: "PAYMENT",
        loanId: p.loan?._id,
        amount: p.amountPaid,
        reference: p.reference,
        method: p.method,
      })
    );

    auditLogs.forEach((log) =>
      timeline.push({
        date: log.createdAt,
        type: log.action,
        loanId: log.loan,
        meta: log.meta,
        actorRole: log.actorRole,
      })
    );

    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

/**
 * ======================================================
 * 📄 PAGINATION (MUHIMU SANA)
 * ======================================================
 */
   const page = Number(filters.page || 1);
   const limit = 200;

   const paginatedTimeline = timeline.slice(
     (page - 1) * limit,
      page * limit
    );


    /**
     * ======================================================
     * ✅ FINAL OBJECT
     * ======================================================
     */
     return {
       entityType,
       entityProfile,
       securityProfile,   // ⭐ ONGEZA HAPA

       registration: registrationSnapshot,

       statusSnapshot,     // 👈 ONGEZA HAPA
       behaviorMetrics,    // 👈 NA HAPA

       summary: {
       totalLoans,
       paidLoans,
       unpaidLoans,
       totalCollected,
       totalOutstanding,
     },

    loans,
    payments,
    controlNumbers,
    auditLogs,
    timeline: paginatedTimeline,
    timelineTotal: timeline.length,
    generatedAt: new Date(),
  };

  }
}

module.exports = new AdminReportService();
