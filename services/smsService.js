 const AfricasTalking = require("africastalking");

if (
  !process.env.AT_API_KEY ||
  !process.env.AT_USERNAME
) {
  throw new Error(
    "Africa's Talking credentials missing"
  );
}

const africastalking =
  AfricasTalking({
    apiKey:
      process.env.AT_API_KEY,
    username:
      process.env.AT_USERNAME,
  });

const sms =
  africastalking.SMS;

const formatPhone = (
  phone
) => {
  let clean =
    String(phone)
      .replace(/\s+/g, "")
      .replace(/\+/g, "");

  if (
    clean.startsWith("0")
  ) {
    clean =
      "255" +
      clean.slice(1);
  }

  return clean;
};

const sendSMS =
  async (
    phone,
    message
  ) => {
    try {
      const formattedPhone =
        formatPhone(phone);

      const options = {
        to: [
          formattedPhone
        ],
        message,
        from: "CCN",
      };

      const response =
        await sms.send(
          options
        );

      console.log(
        "SMS response:",
        JSON.stringify(
          response,
          null,
          2
        )
      );

      return {
        success: true,
        data: response,
      };

    } catch (error) {
      console.error(
        "SMS sending failed:",
        error.message
      );

      return {
        success: false,
        error:
          error.message,
      };
    }
  };

const sendOTP =
  async (
    phone,
    otp
  ) => {
    const message =
      `CCN: Code yako ya kurekebisha PIN ni ${otp}. Itatumika kwa dakika 5.`;

    return await sendSMS(
      phone,
      message
    );
  };

module.exports = {
  sendSMS,
  sendOTP,
};
