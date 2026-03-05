 const axios = require("axios");

class SmsService {

  async sendSMS(phone, message) {

    if (!phone) {
      throw new Error("Phone number missing");
    }

    if (!message) {
      throw new Error("SMS message missing");
    }

    const payload = {
      source_addr: process.env.BEEM_SENDER || undefined,
      encoding: 0,
      schedule_time: "",
      message: message,
      recipients: [
        {
          recipient_id: 1,
          dest_addr: phone
        }
      ]
    };

    try {

      const response = await axios.post(
        "https://apisms.beem.africa/v1/send",
        payload,
        {
          auth: {
            username: process.env.BEEM_API_KEY,
            password: process.env.BEEM_SECRET_KEY
          },
          headers: {
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      console.log("SMS sent:", response.data);

      return response.data;

    } catch (error) {

      console.error(
        "SMS sending error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to send SMS");

    }
  }

}

module.exports = new SmsService();
