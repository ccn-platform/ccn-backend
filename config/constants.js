 // config/constants.js

module.exports = {
  ROLES: {
    CUSTOMER: "customer",
    AGENT: "agent",   // <-- includes merchant responsibilities
    ADMIN: "admin",
  },

  LOAN_STATUS: {
    PENDING: "pending",
    APPROVED: "approved",
    REJECTED: "rejected",
    ACTIVE: "active",
    PAID: "paid",
    OVERDUE: "overdue",
  },

  PAYMENT_STATUS: {
    PENDING: "pending",
    SUCCESS: "success",
    FAILED: "failed",
  },

  CONTROL_NUMBER_STATUS: {
    ACTIVE: "active",
    USED: "used",
    EXPIRED: "expired",
  },

  DEVICE_STATUS: {
    LOCKED: "locked",
    UNLOCKED: "unlocked",
  },

  RISK_LEVEL: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
  },
};
