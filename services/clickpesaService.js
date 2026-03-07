 const axios = require("axios");

class ClickPesaService {

 async mobilePush(phone, amount, reference) {

  if (!amount || amount <= 0) {
   throw new Error("Invalid payment amount");
  }

  // normalize Tanzania phone format
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

   const url =
    `${process.env.CLICKPESA_BASE_URL}/third-parties/payments/initiate-ussd-push-request`;

   console.log("ClickPesa URL:", url);

   const response = await axios.post(
    url,
    {
     amount: amount.toString(),
     currency: "TZS",
     orderReference: reference,
     phoneNumber: phone
    },
    {
     headers: {
      Authorization: `Bearer ${process.env.CLICKPESA_TOKEN}`,
      "Content-Type": "application/json"
     },
     timeout: 10000
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
