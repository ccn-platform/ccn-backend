/**
 * ======================================================
 * MESSAGE HANDLER (BRAIN)
 * ======================================================
 * - Inapokea MESSAGE KEY
 * - Inaamua:
 *   - ujumbe gani urudi
 *   - itume push au la
 *   - push template ipi itumike
 */

const MESSAGE_KEYS = require("../constants/messageKeys");
const MESSAGES = require("../constants/messages");

// OPTIONAL (SAFE): push service
let pushService;
try {
  pushService = require("./pushService");
} catch {
  pushService = null;
}

const MESSAGE_RULES = {
  // ======================
  // USER / AUTH
  // ======================
  [MESSAGE_KEYS.USER_BLOCKED]: {
    notify: true,
    pushTemplate: "USER_BLOCKED",
  },

  [MESSAGE_KEYS.USER_UNBLOCKED]: {
    notify: true,
    pushTemplate: "USER_UNBLOCKED",
  },

  [MESSAGE_KEYS.OTP_REQUESTED]: {
    notify: true,
    pushTemplate: "OTP",
  },

  [MESSAGE_KEYS.PIN_RESET_REQUESTED]: {
    notify: true,
    pushTemplate: "PIN_RESET",
  },

  // ======================
  // LOAN
  // ======================
  [MESSAGE_KEYS.LOAN_REQUESTED]: {
    notify: false,
  },

  [MESSAGE_KEYS.LOAN_APPROVED]: {
    notify: true,
    pushTemplate: "LOAN_APPROVED",
  },

  [MESSAGE_KEYS.LOAN_REJECTED]: {
    notify: true,
    pushTemplate: "LOAN_REJECTED",
  },

  [MESSAGE_KEYS.CONTROL_NUMBER_CREATED]: {
    notify: true,
    pushTemplate: "CONTROL_NUMBER",
  },

  // ======================
  // PAYOUT
  // ======================
  [MESSAGE_KEYS.PAYOUT_ACCOUNT_CREATED]: {
    notify: false,
  },

  [MESSAGE_KEYS.PAYOUT_ACCOUNT_PRIMARY_CHANGED]: {
    notify: false,
  },
};

class MessageHandler {
  /**
   * ======================================================
   * HANDLE MESSAGE
   * ======================================================
   */
  async handle({
    key,
    user = null,          // user document
    pushToken = null,     // expoPushToken
    payload = {},         // dynamic values
  }) {
    const message = MESSAGES[key] || MESSAGES.SYSTEM_ERROR;
    const rule = MESSAGE_RULES[key] || { notify: false };

    // 🔔 SEND PUSH (OPTIONAL & SAFE)
    if (
      rule.notify &&
      pushService &&
      pushToken &&
      rule.pushTemplate
    ) {
      try {
        await pushService.sendTemplate(
          pushToken,
          rule.pushTemplate,
          payload
        );
      } catch (e) {
        console.error("Push send failed:", e.message);
      }
    }

    return {
      message,
      key,
      notified: rule.notify === true,
    };
  }
}

module.exports = new MessageHandler();
