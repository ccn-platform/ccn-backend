 
const biometricService = require("../services/biometricService");

class BiometricController {
  async verifyCustomerFace(req, res) {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          message: "Image is required",
        });
      }

      const result = await biometricService.verifyCustomerFace(image);

      if (!result.allowed) {
        return res.status(409).json({
          success: false,
          reason: result.reason,
        });
      }

      return res.status(200).json({
        success: true,
        biometricId: result.biometricId,
      });
    } catch (error) {
      console.error("Biometric error:", error);
      return res.status(500).json({
        success: false,
        message: "Biometric verification failed",
      });
    }
  }
}

module.exports = new BiometricController();
