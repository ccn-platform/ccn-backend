 // services/ussdService.js

const normalizePhone = require("../utils/normalizePhone");

const userService = require("./userService");
const customerService = require("./customerService");
const loanService = require("./loanService");
const paymentService = require("./paymentService");

/**
 * ======================================================
 * USSD SERVICE — CCN (*212*88#)
 * ======================================================
 *
 * SUPPORTED NETWORKS:
 * - Vodacom
 * - Airtel
 * - Tigo
 * - Halotel
 *
 * SESSION FLOW:
 * 1. Dial *212*88#
 * 2. Enter PIN
 * 3. Main Menu
 * 4. Actions (Loan / Balance / Pay)
 *
 * IMPORTANT:
 * - Stateless (provider handles sessionId)
 * - No DB writes for sessions
 * - 100% compatible with existing services
 */

class UssdService {
  /**
   * ======================================================
   * MAIN ENTRY (Called by USSD Controller)
   * ======================================================
   */
  async handleUssd({ sessionId, phoneNumber, text }) {
    try {
      const phone = normalizePhone(phoneNumber);

      // 🆕 SAFE ADDITION — Detect Network (Vodacom / Airtel / Tigo / Halotel)
      const network = this.detectNetwork(phone);

      const inputs = text ? text.split("*") : [];

      /**
       * STEP 0 — FIRST DIAL
       */
      if (inputs.length === 0) {
        return this.menuEnterPin(network);
      }

      /**
       * STEP 1 — PIN LOGIN
       */
      if (inputs.length === 1) {
        const pin = inputs[0];
        return await this.authenticateCustomer(phone, pin);
      }

      /**
       * STEP 2 — MAIN MENU ACTIONS
       */
      const pin = inputs[0];
      const action = inputs[1];

      const customer = await this.verifySession(phone, pin);

      switch (action) {
        case "1":
          return await this.handleLoanRequest(customer);

        case "2":
          return await this.handleOutstandingBalance(customer);

        case "3":
          return this.menuPayLoan();

        case "4":
          return this.exit("Asante kwa kutumia CCN.");

        default:
          return this.exit("Chaguo sio sahihi.");
      }
    } catch (err) {
      return this.exit(err.message || "Hitilafu imetokea.");
    }
  }

  /**
   * ======================================================
   * NETWORK DETECTION (SAFE — FUTURE USE)
   * ======================================================
   */
  detectNetwork(phone) {
    // phone format: 2557XXXXXXXX
    const prefix = phone.slice(0, 5);

    const networks = {
      "25571": "Vodacom",
      "25575": "Vodacom",
      "25576": "Vodacom",

      "25578": "Airtel",
      "25568": "Airtel",

      "25565": "Tigo",
      "25567": "Tigo",

      "25562": "Halotel", // ⭐ HALOTEL
    };

    return networks[prefix] || "Unknown";
  }

  /**
   * ======================================================
   * MENUS
   * ======================================================
   */
  menuEnterPin(network) {
    return {
      type: "CON",
      message: `Karibu CCN (${network})\nWeka PIN yako:`,
    };
  }

  menuMain() {
    return {
      type: "CON",
      message:
        "CCN MENU\n" +
        "1. Omba Mkopo\n" +
        "2. Angalia Deni\n" +
        "3. Lipa Mkopo\n" +
        "4. Toka",
    };
  }

  menuPayLoan() {
    return {
      type: "END",
      message:
        "Tafadhali tumia Control Number kulipa mkopo wako.\nAsante.",
    };
  }

  exit(message) {
    return { type: "END", message };
  }

  /**
   * ======================================================
   * AUTHENTICATION
   * ======================================================
   */
  async authenticateCustomer(phone, pin) {
    const user = await userService.listUsers("customer").then((users) =>
      users.find((u) => u.phone === phone)
    );

    if (!user) {
      return this.exit("Akaunti haijapatikana.");
    }

    const bcrypt = require("bcryptjs");
    const match = await bcrypt.compare(pin, user.pin);

    if (!match) {
      return this.exit("PIN sio sahihi.");
    }

    return this.menuMain();
  }

  async verifySession(phone, pin) {
    const user = await userService.listUsers("customer").then((users) =>
      users.find((u) => u.phone === phone)
    );

    if (!user) throw new Error("Akaunti haijapatikana.");

    const bcrypt = require("bcryptjs");
    const match = await bcrypt.compare(pin, user.pin);
    if (!match) throw new Error("PIN sio sahihi.");

    const customer = await customerService.findCustomerByPhoneNormalized(phone);
    if (!customer) throw new Error("Mteja hajapatikana.");

    return customer;
  }

  /**
   * ======================================================
   * ACTIONS
   * ======================================================
   */

  /**
   * 1️⃣ REQUEST LOAN (USSD SIMPLIFIED)
   */
  async handleLoanRequest(customer) {
    try {
      const eligibility = await loanService.checkBorrowingEligibility(
        customer._id
      );

      if (!eligibility.allowed) {
        return this.exit(eligibility.reason);
      }

      return this.exit(
        "Ombi la mkopo limepokelewa.\nTafadhali wasiliana na wakala wako."
      );
    } catch (err) {
      return this.exit(err.message);
    }
  }

  /**
   * 2️⃣ CHECK OUTSTANDING BALANCE
   */
  async handleOutstandingBalance(customer) {
    const balance = await paymentService.getOutstandingBalance(
      customer._id
    );

    if (!balance || balance.totalDue <= 0) {
      return this.exit("Huna deni lolote kwa sasa.");
    }

    return this.exit(
      `Jumla ya deni lako ni Tsh ${balance.totalDue}.\nAsante.`
    );
  }
}

module.exports = new UssdService();
