 const axios = require("axios");

class ClickPesaAuthService {

 async getToken() {

  try {

   const response = await axios.post(
    `${process.env.CLICKPESA_BASE_URL}/third-parties/generate-token`,
    {},
    {
     headers: {
      "api-key": process.env.CLICKPESA_API_KEY,
      "client-id": process.env.CLICKPESA_CLIENT_ID
     },
     timeout: 10000
    }
   );

   if (!response.data?.token) {
    throw new Error("Token not returned from ClickPesa");
   }

   return response.data.token;

  } catch (error) {

   console.error(
    "ClickPesa token error:",
    error.response?.data || error.message
   );

   throw new Error("Failed to generate ClickPesa token");
  }

 }

}

module.exports = new ClickPesaAuthService();
