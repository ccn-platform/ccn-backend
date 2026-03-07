 const axios = require("axios");

class ClickPesaAuthService {

 async getToken() {

  try {

   const response = await axios.post(
    `${process.env.CLICKPESA_BASE_URL}/oauth/token`,
    {},
    {
     headers: {
      "X-CLIENT-ID": process.env.CLICKPESA_CLIENT_ID,
      "X-API-KEY": process.env.CLICKPESA_API_KEY,
      "Content-Type": "application/json"
     },
     timeout: 10000
    }
   );

   if (!response.data?.access_token) {
    throw new Error("Token not returned from ClickPesa");
   }

   return response.data.access_token;

  } catch (error) {

   console.error("ClickPesa token error:", 
    error.response?.data || error.message
   );

   throw new Error("Failed to generate ClickPesa token");
  }

 }

}

module.exports = new ClickPesaAuthService();
