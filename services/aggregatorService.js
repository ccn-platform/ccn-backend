 // services/aggregatorService.js

const axios = require("axios");
const ControlNumber = require("../models/controlNumber");
const paymentService = require("./paymentService");
const automationService = require("./automationService");

class AggregatorService {
  constructor() {
    this.provider = process.env.PAYMENT_PROVIDER || "AZAMPAY";
  }

  /**
   * ======================================================
   * 1️⃣ GENERATE CONTROL NUMBER
   * ======================================================
   */
  async generateControlNumber({ amount, customer, phone, reason }) {
    // SAVE control number record as "pending"
    const control = await ControlNumber.create({
      customer,
      phone,
      amount,
      status: "pending",
      reason,
      provider: this.provider,
      createdAt: new Date(),
      expiryTime: new Date(Date.now() + 3600 * 1000), // expires in 1 hour
    });

    // Provider-specific request (placeholder)
    const providerResponse = await this.requestToProvider({
      controlId: control._id,
      amount,
      phone,
    });

    // Save provider control number
    control.controlNumber = providerResponse.controlNumber;
    control.status = "generated";
    await control.save();

    return {
      controlNumber: control.controlNumber,
      provider: this.provider,
      amount,
      expiresIn: 3600,
    };
  }

  /**
   * ======================================================
   * 2️⃣ SIMULATE REQUEST TO PAYMENT PROVIDER
   * (TUTABADILISHA HII BAADA YA KUPATA REAL API)
   * ======================================================
   */
  async requestToProvider({ controlId, amount }) {
    console.log("🔄 Sending request to provider... (SIMULATED)");

    // Hapa ndipo utaweka communication ya real provider:
    // example:
    // const res = await axios.post("https://azam/api/control", {...})
    // return res.data;

    return {
      controlNumber: "99" + String(controlId).slice(-8),
      status: "success",
    };
  }

  /**
   * ======================================================
   * 3️⃣ VERIFY PAYMENT CALLBACK
   * Provider akituma confirm kwamba control number imelipwa
   * ======================================================
   */
  async verifyCallback({ controlNumber, amountPaid, transactionId }) {
    // Fetch the control number object
    const control = await ControlNumber.findOne({ controlNumber });

    if (!control) throw new Error("Control number not found.");

    // Already processed?
    if (control.status === "paid") return control;

    // Update as paid
    control.status = "paid";
    control.transactionId = transactionId;
    control.paidAt = new Date();
    control.amountPaid = amountPaid;
    await control.save();

    // Process the payment inside paymentService
    await paymentService.processPayment({
      customer: control.customer,
      controlNumber,
      amount: amountPaid,
    });

    // Unlock device if applicable
    await automationService.unlockAfterPayment(control.customer);

    console.log("💰 Payment processed successfully.");

    return control;
  }

  /**
   * ======================================================
   * 4️⃣ REGENERATE CONTROL NUMBER IF EXPIRED
   * ======================================================
   */
  async regenerateExpiredControl(customerId) {
    const expired = await ControlNumber.findOne({
      customer: customerId,
      status: "expired",
    });

    if (!expired) return null;

    return await this.generateControlNumber({
      amount: expired.amount,
      customer: expired.customer,
      phone: expired.phone,
      reason: expired.reason,
    });
  }
}

module.exports = new AggregatorService();
