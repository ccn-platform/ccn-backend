 const axios = require("axios");
const crypto = require("crypto");
const clickpesaAuth = require("./clickpesaAuthService");

class ClickPesaService {

 async mobilePush(phone, amount, reference) {

  if (!amount || amount <= 0) {
   throw new Error("Invalid payment amount");
  }

  phone = phone.replace(/\D/g, "");

  if (phone.startsWith("0")) {
   phone = "255" + phone.slice(1);
  }

  if (!phone.startsWith("255") || phone.length !== 12) {
   throw new Error("Invalid Tanzania phone number");
  }

  try {

   const token = await clickpesaAuth.getToken();

   const url =
   `${process.env.CLICKPESA_BASE_URL}/third-parties/payments/initiate-ussd-push-request`;

 const amountStr = String(amount);
const secret = process.env.CLICKPESA_API_SECRET.trim();

const payloadString =
`${amountStr}${reference}${phone}${secret}`;

const checksum = crypto
.createHash("sha256")
.update(payloadString, "utf8")
.digest("hex");

console.log("Checksum string:", payloadString);
console.log("Checksum hash:", checksum);

   const response = await axios.post(
    url,
    {
     amount: amountStr,
     currency: "TZS",
     orderReference: reference,
     phoneNumber: phone,
     checksum: checksum
    },
    {
     headers: {
      Authorization: token,
      "Content-Type": "application/json"
     },
     timeout: 10000
    }
   );

   console.log("ClickPesa response:", response.data);

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
