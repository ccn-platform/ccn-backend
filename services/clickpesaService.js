 const axios = require("axios");

class ClickPesaService {

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

      const url = `${process.env.CLICKPESA_BASE_URL}/third-parties/payment`;

      console.log("ClickPesa URL:", url);

      const response = await axios.post(
        url,
        {
          amount,
          currency: "TZS",
          phone,
          reference,
          description: "CCN Agent Subscription"
        },
        {
          headers: {
            "X-CLIENT-ID": process.env.CLICKPESA_CLIENT_ID,
            "X-API-KEY": process.env.CLICKPESA_API_KEY,
            "Content-Type": "application/json"
          },
          timeout: 10000,
          validateStatus: status => status >= 200 && status < 300
        }
      );

      console.log("ClickPesa response:", response.data);

      if (!response.data) {
        throw new Error("Empty response from ClickPesa");
      }

      if (response.data.status === "FAILED") {
        console.error("ClickPesa rejected request:", response.data);
        throw new Error("ClickPesa rejected payment request");
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
