 const axios = require("axios");

class ClickPesaAuthService {

 async getToken() {

  const url =
   `${process.env.CLICKPESA_BASE_URL}/third-parties/generate-token`;

  const response = await axios.post(
   url,
   {},
   {
    headers: {
     "api-key": process.env.CLICKPESA_API_KEY,
     "client-id": process.env.CLICKPESA_CLIENT_ID
    },
    timeout: 10000
   }
  );

  if (!response.data || !response.data.token) {
   throw new Error("Token not returned from ClickPesa");
  }

  return response.data.token;
 }

}

module.exports = new ClickPesaAuthService();
