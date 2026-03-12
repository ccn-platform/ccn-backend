  const axios = require("axios");
const User = require("../models/User");

class PushService {

  constructor() {
    this.expoUrl = "https://exp.host/--/api/v2/push/send";
  }

  /**
   * ======================================================
   * 1️⃣ SEND SINGLE PUSH
   * ======================================================
   */
  async sendRaw(token, title, body, data = {}) {

    if (!token || !token.startsWith("ExponentPushToken")) {
      console.error("❌ Invalid Expo push token");
      return { success: false };
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

      return { success: true, response: response.data };

    } catch (error) {

      console.error("❌ Push error:", error.message);
      return { success: false };

    }

  }


  /**
   * ======================================================
   * 2️⃣ BULK PUSH (SCALABLE VERSION)
   * ======================================================
   */
  async sendBulk(tokens, title, body, data = {}) {

    if (!tokens || tokens.length === 0) {
      return [];
    }

    const chunkSize = 100;
    const chunks = [];

    for (let i = 0; i < tokens.length; i += chunkSize) {
      chunks.push(tokens.slice(i, i + chunkSize));
    }

    try {

      const requests = chunks.map(chunk => {

  const messages = chunk.map(token => ({
    to: token,
    title,
    body,
    data,
    sound: "default",
    priority: "high",
  }));

  return axios.post(
    this.expoUrl,
    messages,
    {
      timeout: 5000,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

});
      const responses = await Promise.all(requests);

      return responses.map(r => r.data);

    } catch (err) {

      console.error("❌ Bulk push error:", err.message);
      return [];

    }

  }


  /**
   * ======================================================
   * 3️⃣ TEMPLATE NOTIFICATIONS
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

      LOAN_BLOCKED: {
         title: "Ombi la mkopo limezuiwa",
         body: `Huwezi kuomba mkopo kwa sasa. Sababu: ${data.reason}`,
       },

      LOAN_BLOCKED_FOR_AGENT: {
       title: "Ombi la mkopo limezuiwa",
       body: `${data.name} ombi lake la mkopo limezuiwa kuja kwako kwa sababu ${data.reason}`,
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
        body: `Simu yako imefunguliwa baada ya kulipa deni.`,
      }

    };

    const template = templates[templateName];

    if (!template) {
      throw new Error("Push template not found");
    }

    return this.sendRaw(token, template.title, template.body, data);

  }


  /**
   * ======================================================
   * 4️⃣ SEND PUSH TO USER
   * ======================================================
   */
  async sendToUser(userId, payload) {

    const user = await User.findById(userId)
      .select("expoPushToken pushToken phone");

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
      phone: user.phone,
    };

    return this.sendRaw(token, title, body, data);

  }

}

module.exports = new PushService();
