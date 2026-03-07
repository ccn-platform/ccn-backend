 const axios = require("axios");

class ClickPesaService {

  // 🔐 1. PATA TOKEN
  async getAccessToken() {

    try {

      const response = await axios.post(
        "https://api.clickpesa.com/oauth/token",
        {
          client_id: process.env.CLICKPESA_CLIENT_ID,
          client_secret: process.env.CLICKPESA_API_KEY
        }
      );

      return response.data.access_token;

    } catch (error) {

      console.error(
        "ClickPesa token error:",
        error.response?.data || error.message
      );

      throw new Error("Failed to generate ClickPesa token");
    }
  }


  // 💳 2. MOBILE PUSH
  async mobilePush(phone, amount, reference) {

    if (!amount || amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    phone = phone.replace(/\D/g, "");

    if (phone.startsWith("0")) {
      phone = "255" + phone.slice(1);
    }

    if (!phone.startsWith("255")) {
      throw new Error("Invalid phone number format");
    }

    if (phone.length !== 12) {
      throw new Error("Invalid Tanzania phone number");
    }

    try {

      // 🔑 pata token kwanza
      const token = await this.getAccessToken();

      const url = `${process.env.CLICKPESA_BASE_URL}/third-parties/payment`;

      console.log("ClickPesa URL:", url);

      const response = await axios.post(
        url,
        {
          amount,
          currency: "TZS",
          msisdn: phone,
          reference,
          description: "CCN Agent Subscription"
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 10000
        }
      );

      console.log("ClickPesa response:", response.data);

      if (!response.data) {
        throw new Error("Empty response from ClickPesa");
      }

      return response.data;

    } catch (error) {

      console.error("ClickPesa payment error", {
        reference,
        phone,
        amount,
        error: error.response?.data || error.message
      });

      throw new Error("Mobile push request failed");
    }
  }
}

module.exports = new ClickPesaService();
