const axios = require("axios");

class ClickPesaAuthService {

 async getToken() {

  const response = await axios.post(
   `${process.env.CLICKPESA_BASE_URL}/oauth/token`,
   {},
   {
    headers: {
     "X-CLIENT-ID": process.env.CLICKPESA_CLIENT_ID,
     "X-API-KEY": process.env.CLICKPESA_API_KEY,
     "Content-Type": "application/json"
    }
   }
  );

  return response.data.access_token;

 }

}

module.exports = new ClickPesaAuthService();
