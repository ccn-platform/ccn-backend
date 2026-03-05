 const AfricasTalking = require("africastalking");

// Hakikisha environment variables zipo
if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
  throw new Error("Africa's Talking credentials missing in environment variables");
}

// Initialize Africa's Talking
const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

const sms = africastalking.SMS;

/**
 * Send SMS message
 * @param {string} phone - Phone number (e.g. +2557XXXXXXXX)
 * @param {string} message - SMS content
 */
const sendSMS = async (phone, message) => {
  try {
     const formattedPhone = "+" + phone;

const options = {
  to: [formattedPhone],
  message: message,
};

    const response = await sms.send(options);

    console.log("SMS sent successfully:", response);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("SMS sending failed:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send OTP SMS
 * @param {string} phone
 * @param {string|number} otp
 */
const sendOTP = async (phone, otp) => {
  const message = `Your CCN verification code is ${otp}. This code will expire in 5 minutes.`;

  return await sendSMS(phone, message);
};

module.exports = {
  sendSMS,
  sendOTP,
};
