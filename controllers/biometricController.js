  const biometricService = require("../services/biometricService");

class BiometricController {
  async verifyCustomerFace(req, res) {
    const guard = req.registerGuard || null;

    try {
     const { image, deviceId } = req.body;

     if (!image) {
  return res.status(400).json({
    success: false,
    message: "Image is required",
  });
}

if (!deviceId) {
  return res.status(400).json({
    success: false,
    message: "Device ID missing",
  });
}

      // =====================================
      // 🚫 BLOCK CHECK (24H)
      // =====================================
      if (guard && guard.blockedUntil && new Date() < guard.blockedUntil) {
        return res.status(429).json({
          success: false,
          message: "Umezuiwa kwa saa 24. Jaribu kesho. kumbuka hauruhusiwi kujisajili mara mbili",
        });
      }
    const result = await biometricService.verifyCustomerFace(
        image,
        deviceId
    );
       
      // =====================================
      // RESET ATTEMPTS IF SUCCESS
      // =====================================
      if (guard) {
        guard.attempts = 0;
        guard.blockedUntil = null;
        await guard.save();
      }

      return res.status(200).json({
        success: true,
        biometricId: result.biometricId,
      });

    } 
    
    catch (error) {

// =====================================
// DEVICE ALREADY USED
// =====================================
   if (error.code === "DEVICE_USED") {
      return res.status(409).json({
       success: false,
      message: "Simu hii tayari imeshatumika kujisajili.",
    });
  }
      // =====================================
      // 🔴 FACE DUPLICATE CONTROL
      // =====================================
      if (error.code === "FACE_DUPLICATE") {

        if (guard) {
          guard.attempts += 1;

          // mara ya pili → block
          if (guard.attempts >= 3) {
            guard.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await guard.save();

            return res.status(429).json({
              success: false,
              message: " tayari umesha jisajili huruhusiwi kua na account mbili. Umezuiwa kwa masaa 24.",
            });
          }

          await guard.save();
        }

        return res.status(409).json({
        success: false,
         message: "Face tayari ipo. kujisajili ni mara moja tu.",
       });

      }
    // ===============================
// OTHER KNOWN ERRORS
// ===============================
if (
  error.code === "NO_FACE" ||
  error.code === "UNDERAGE" ||
  error.code === "AGE_UNCERTAIN" ||
  error.code === "NO_IMAGE" ||
  error.code === "AGE_DETECT_FAIL"   // 🔴 ONGEZA HII
) {
  return res.status(400).json({
    success: false,
    message: error.message,
  });
}

      console.error("Biometric error:", error);

let message =
  error.message ||
  error.code ||
  "Face scan imeshindikana. Tafadhali jaribu tena.";

// network timeout
if (error.name === "TimeoutError") {
  message = "Internet yako ni polepole. Jaribu tena.";
}

// network connection
if (error.name === "NetworkingError") {
  message = "Tatizo la network. Angalia internet.";
}

return res.status(500).json({
  success: false,
  message,
});


    }
  }
}

module.exports = new BiometricController();
