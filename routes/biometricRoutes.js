 const express = require("express");
const router = express.Router();
const biometricController = require("../controllers/biometricController");
const rateLimiter = require("../middleware/rateLimiter");

router.post(
  "/verify",
  rateLimiter.biometric,
  biometricController.verifyCustomerFace   // ✅ SAHIHI
);

module.exports = router;
