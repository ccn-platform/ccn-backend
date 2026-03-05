 const axios = require("axios");

class SmsService {
  async sendSMS(phone, message) {
    try {
      const response = await axios.post(
        "https://apisms.beem.africa/v1/send",
        {
          source_addr: process.env.BEEM_SENDER || "INFO",
          encoding: 0,
          message,
          recipients: [
            {
              recipient_id: 1,
              dest_addr: phone,
            },
          ],
        },
        {
          auth: {
            username: process.env.BEEM_API_KEY,
            password: process.env.BEEM_SECRET_KEY,
          },
        }
      );

      return response.data;
    } catch (err) {
      console.error("SMS sending error:", err.response?.data || err.message);
    }
  }
}

module.exports = new SmsService();
