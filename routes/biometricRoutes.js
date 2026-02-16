  const express = require("express");
const router = express.Router();
const biometricController = require("../controllers/biometricController");
const rateLimiter = require("../middleware/rateLimiter");
const registerGuard = require("../middleware/registerGuard");

router.post(
  "/verify",
  rateLimiter.biometric,
   registerGuard,   // 🔴 HAPA NDIO INAWEKA device guard
  biometricController.verifyCustomerFace   // ✅ SAHIHI
);

module.exports = router;
