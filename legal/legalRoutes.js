const express = require("express");
const router = express.Router();
const LegalController = require("./legalController");

// 🌍 Public (hakuna token)
router.get("/privacy", LegalController.getPrivacy);
router.get("/terms/customer", LegalController.getCustomerTerms);
router.get("/terms/agent", LegalController.getAgentTerms);
router.get("/consent/biometric", LegalController.getBiometricConsent);

module.exports = router;
