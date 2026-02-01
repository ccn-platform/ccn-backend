 // config/smsConfig.js
module.exports = {
  africasTalking: {
    apiKey: process.env.AT_API_KEY || "",
    username: process.env.AT_USERNAME || "sandbox",
    senderId: process.env.AT_SENDER_ID || "",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || "",
    authToken: process.env.TWILIO_AUTH_TOKEN || "",
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
  },
};
