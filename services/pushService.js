   // services/pushService.js

const axios = require("axios");
const User = require("../models/User"); // 🆕 SAFE ADD

class PushService {
  constructor() {
    this.expoUrl = "https://exp.host/--/api/v2/push/send";
  }

  /**
   * ======================================================
   * 1️⃣ Send raw Expo push notification
   * ======================================================
   */
  async sendRaw(token, title, body, data = {}) {
    if (!token || !token.startsWith("ExponentPushToken")) {
      console.error("❌ Invalid or missing Expo push token");
      return { success: false, message: "Invalid push token" };
    }

    try {
      const response = await axios.post(this.expoUrl, {
        to: token,
        title,
        body,
        data,
        sound: "default",
        priority: "high",
      });

      console.log("📩 Push sent:", response.data);
      return { success: true, response: response.data };
    } catch (error) {
      console.error("❌ Push Notification Error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * ======================================================
   * 2️⃣ Send template notifications
   * ======================================================
   */
  async sendTemplate(token, templateName, data = {}) {
    const templates = {
      WELCOME: {
        title: "Karibu CCN",
        body: `Habari ${data.name}, akaunti yako imeundwa kikamilifu.`,
      },

      LOAN_APPROVED: {
        title: "Mkopo Umekubaliwa 🎉",
        body: `Hongera ${data.name}, mkopo wa ${data.amount} TZS umekubaliwa.`,
      },

      LOAN_REJECTED: {
        title: "Mkopo Umekataliwa",
        body: `Samahani ${data.name}, ombi lako halijakubaliwa.`,
      },

      CONTROL_NUMBER: {
        title: "Control Number Imekamilika",
        body: `Control Number: ${data.cn} | Kiasi: ${data.amount} TZS.`,
      },

      PAYMENT_CONFIRMED: {
        title: "Malipo Yamepokelewa",
        body: `Tumepokea malipo ya ${data.amount} TZS.`,
      },

      DEVICE_LOCKED: {
        title: "Simu Yamefungwa 🔐",
        body: `Simu yako imefungwa kwa sababu ya deni lililochelewa.`,
      },

      DEVICE_UNLOCKED: {
        title: "Simu Imefunguliwa 🔓",
        body: `Simu yako imefunguliwa baada ya kulipa deni. Asante!`,
      },
    };

    const template = templates[templateName];

    if (!template) {
      throw new Error("Push template not found");
    }

    return this.sendRaw(token, template.title, template.body, data);
  }

  /**
   * ======================================================
   * 3️⃣ Bulk notifications
   * ======================================================
   */
  async sendBulk(tokens, title, body) {
    const results = [];

    for (const token of tokens) {
      const res = await this.sendRaw(token, title, body);
      results.push(res);
    }

    return results;
  }

  /**
   * ======================================================
   * 🆕 4️⃣ SEND TO USER (SAFE ADD — DO NOT BREAK EXISTING)
   * ======================================================
   * - Used by authService (forgot PIN, security alerts)
   * - Fetches user's expoPushToken internally
   */
   async sendToUser(userId, payload) {
  const user = await User.findById(userId).select("expoPushToken pushToken phone");
  if (!user) {
    console.error("❌ User not found for push");
    return;
  }

  const token = user.expoPushToken || user.pushToken;
  if (!token) {
    console.error("❌ User has no push token");
    return;
  }

  const title = payload.title || "Notification";
  const body = payload.body || "";
  const type = payload.type || null;

  const data = {
    ...payload.data,
    type,
    phone: user.phone, // ⭐ MUHIMU SANA
  };

  return this.sendRaw(token, title, body, data);
}

}

module.exports = new PushService();
