  const fs = require("fs");
const path = require("path");
const versions = require("./legalVersion");

class LegalController {

  // ================================
  // PRIVACY POLICY
  // ================================
  static getPrivacy(req, res) {
    const filePath = path.join(__dirname, "privacy.policy.customer.md");
    const content = fs.readFileSync(filePath, "utf8");

    const acceptHeader = req.headers.accept || "";

    // 🌍 Kama imefunguliwa na browser
    if (acceptHeader.includes("text/html")) {
      return res.send(`
        <html>
          <head>
            <title>Privacy Policy</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 40px;
                max-width: 900px;
                margin: auto;
                line-height: 1.7;
              }
              h1,h2,h3 {
                color: #111;
              }
              pre {
                white-space: pre-wrap;
                font-family: Arial, sans-serif;
              }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
    }

    // 📱 Default → app
    res.json({
      type: "privacy",
      version: versions.privacy.version,
      lastUpdated: versions.privacy.lastUpdated,
      content,
    });
  }

  // ================================
  // CUSTOMER TERMS
  // ================================
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

  // ================================
  // AGENT TERMS
  // ================================
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

  // ================================
  // BIOMETRIC CONSENT
  // ================================
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
