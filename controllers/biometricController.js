  const biometricService = require("../services/biometricService");

class BiometricController {
  async verifyCustomerFace(req, res) {
    const guard = req.registerGuard || null;

    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: "Image is required",
        });
      }

      // =====================================
      // 🚫 BLOCK CHECK (24H)
      // =====================================
      if (guard && guard.blockedUntil && new Date() < guard.blockedUntil) {
        return res.status(429).json({
          success: false,
          reason: "Umezuiwa kwa saa 24. Jaribu kesho. kumbuka hauruhusiwi kujisajili mara mbili",
        });
      }

      const result = await biometricService.verifyCustomerFace(image);

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

    } catch (error) {

      // =====================================
      // 🔴 FACE DUPLICATE CONTROL
      // =====================================
      if (error.code === "FACE_DUPLICATE") {

        if (guard) {
          guard.attempts += 1;

          // mara ya pili → block
          if (guard.attempts >= 2) {
            guard.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
            await guard.save();

            return res.status(429).json({
              success: false,
              reason: " tayari umesha jisajili huruhusiwi kua na account mbili. Umezuiwa kwa masaa 24.",
            });
          }

          await guard.save();
        }

        return res.status(409).json({
          success: false,
          reason: "Face tayari ipo. kujisajili  ni mara moja tu.",
        });
      }

      console.error("Biometric error:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Biometric verification failed",
      });
    }
  }
}

module.exports = new BiometricController();
