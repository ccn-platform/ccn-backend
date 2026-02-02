/**
 * ======================================================
 * MESSAGE KEYS (SYSTEM EVENTS)
 * ======================================================
 * - HAZINA MAANDISHI
 * - Hutumika kama COMMANDS
 * - Zinatumiwa na MessageHandler
 */

module.exports = {
  // ======================
  // AUTH / USER
  // ======================
  USER_REGISTERED: "USER_REGISTERED",
  USER_BLOCKED: "USER_BLOCKED",
  USER_UNBLOCKED: "USER_UNBLOCKED",
  USER_DELETED: "USER_DELETED",

  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",

  OTP_REQUESTED: "OTP_REQUESTED",
  PIN_RESET_REQUESTED: "PIN_RESET_REQUESTED",
  PIN_RESET_SUCCESS: "PIN_RESET_SUCCESS",

  // ======================
  // AGENT
  // ======================
  AGENT_APPROVED: "AGENT_APPROVED",
  AGENT_SUSPENDED: "AGENT_SUSPENDED",
  AGENT_DELETED: "AGENT_DELETED",

  // ======================
  // LOAN
  // ======================
  LOAN_REQUESTED: "LOAN_REQUESTED",
  LOAN_APPROVED: "LOAN_APPROVED",
  LOAN_REJECTED: "LOAN_REJECTED",
  LOAN_FORCE_CLOSED: "LOAN_FORCE_CLOSED",
  LOAN_MARKED_OVERDUE: "LOAN_MARKED_OVERDUE",

  CONTROL_NUMBER_CREATED: "CONTROL_NUMBER_CREATED",

  // ======================
  // PAYOUT
  // ======================
  PAYOUT_ACCOUNT_CREATED: "PAYOUT_ACCOUNT_CREATED",
  PAYOUT_ACCOUNT_PRIMARY_CHANGED: "PAYOUT_ACCOUNT_PRIMARY_CHANGED",
  PAYOUT_ACCOUNT_DEACTIVATED: "PAYOUT_ACCOUNT_DEACTIVATED",

  // ======================
  // SYSTEM
  // ======================
  SYSTEM_ERROR: "SYSTEM_ERROR",
};
