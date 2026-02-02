 const fs = require("fs");
const path = require("path");
const versions = require("./legalVersion"); // 🆕 ADD ONLY

class LegalController {
  static getPrivacy(req, res) {
    const filePath = path.join(
      __dirname,
      "privacy.policy.customer.md"
    );

    const content = fs.readFileSync(filePath, "utf8");

    res.json({
      type: "privacy",
      version: versions.privacy.version,
      lastUpdated: versions.privacy.lastUpdated,
      content,
    });
  }

  static getCustomerTerms(req, res) {
    const filePath = path.join(__dirname, "terms.customer.md");
    const content = fs.readFileSync(filePath, "utf8");

    res.json({
      type: "terms_customer",
      version: versions.terms.customer.version,
      lastUpdated: versions.terms.customer.lastUpdated,
      content,
    });
  }

  static getAgentTerms(req, res) {
    const filePath = path.join(__dirname, "terms.agent.md");
    const content = fs.readFileSync(filePath, "utf8");

    res.json({
      type: "terms_agent",
      version: versions.terms.agent.version,
      lastUpdated: versions.terms.agent.lastUpdated,
      content,
    });
  }

  static getBiometricConsent(req, res) {
    const filePath = path.join(__dirname, "biometric.consent.md");
    const content = fs.readFileSync(filePath, "utf8");

    res.json({
      type: "biometric_consent",
      version: versions.biometricConsent.version,
      lastUpdated: versions.biometricConsent.lastUpdated,
      content,
    });
  }
}

module.exports = LegalController;
