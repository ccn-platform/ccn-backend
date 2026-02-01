 

 // services/customerService.js

const Customer = require("../models/Customer");
const User = require("../models/User");
const Payment = require("../models/payment");
const ControlNumber = require("../models/controlNumber");
const Loan = require("../models/Loan");
const idGenerator = require("../utils/idGenerator");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ ADDED (SAFE)

class CustomerService {

  /**
   * ======================================================
   * 1️⃣ Create New Customer
   * ======================================================
   */
  async createCustomer(userId, data = {}) {
    const exists = await Customer.findOne({ user: userId });
    if (exists) throw new Error("Customer already exists.");

    const customerId = idGenerator.generateCustomerID();

    const customer = await Customer.create({
      user: userId,
      customerId,
      ...data,
    });

    return customer;
  }

  /**
   * ======================================================
   * 2️⃣ Get Customer By CustomerId
   * ======================================================
   */
  async getCustomerById(customerId) {
    const customer = await Customer.findOne({ customerId })
      .populate("user", "fullName phone");

    if (!customer) throw new Error("Customer not found.");
    return customer;
  }

  /**
   * ======================================================
   * 3️⃣ Update Customer Profile
   * ======================================================
   */
  async updateCustomer(customerId, updates) {
    const customer = await Customer.findOneAndUpdate(
      { customerId },
      updates,
      { new: true }
    );

    if (!customer) throw new Error("Customer not found.");

    return customer;
  }

  /**
   * ======================================================
   * 4️⃣ Add Payment
   * ======================================================
   */
  async addPayment(customerId, paymentData) {
    const customer = await Customer.findOne({ customerId });
    if (!customer) throw new Error("Customer not found.");

    const payment = await Payment.create({
      ...paymentData,
      customer: customer._id,
    });

    return payment;
  }

  /**
   * ======================================================
   * 5️⃣ Get All Payments of Customer
   * ======================================================
   */
  async getPayments(customerId) {
    return Payment.find({ customerId }).sort({ createdAt: -1 });
  }

  /**
   * ======================================================
   * 6️⃣ Get One Payment
   * ======================================================
   */
  async getPaymentById(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("Payment not found.");
    return payment;
  }

  /**
   * ======================================================
   * 7️⃣ Update Payment Status
   * ======================================================
   */
  async updatePaymentStatus(paymentId, status) {
    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { status },
      { new: true }
    );

    if (!payment) throw new Error("Payment not found.");

    return payment;
  }

  /**
   * ======================================================
   * 8️⃣ Partial Payment
   * ======================================================
   */
  async partialPayment(paymentId, amount) {
    const payment = await Payment.findById(paymentId);
    if (!payment) throw new Error("Payment not found.");

    payment.amountPaid += amount;

    if (payment.amountPaid >= payment.amountDue) {
      payment.status = "paid";
    }

    await payment.save();
    return payment;
  }

  /**
   * ======================================================
   * 9️⃣ Sum All Payments
   * ======================================================
   */
  async sumCustomerPayments(customerId) {
    const payments = await Payment.find({ customerId, status: "paid" });

    const sum = payments.reduce((total, p) => total + p.amountPaid, 0);

    return { totalPaid: sum };
  }

  /**
   * ======================================================
   * 🔟 Check If Loan Fully Paid
   * ======================================================
   */
  async checkIfLoanCleared(loanId) {
    const loan = await Loan.findById(loanId);
    if (!loan) throw new Error("Loan not found.");

    return loan.amountPaid >= loan.totalPayable;
  }

  /**
   * ======================================================
   * 1️⃣1️⃣ CUSTOMER → REQUEST LOAN
   * ======================================================
   */
  async requestLoanForCustomer(customerId, payload) {
    const customer = await Customer.findOne({ customerId });
    if (!customer) throw new Error("Customer not found.");

    const loan = await Loan.create({
      ...payload,
      customer: customer._id,
      status: "pending",
    });

    return loan;
  }

  /**
   * ======================================================
   * 1️⃣2️⃣ CUSTOMER → GET MY LOANS
   * ======================================================
   */
  async getMyLoans(customerId) {
    const customer = await Customer.findOne({ customerId });
    if (!customer) throw new Error("Customer not found.");

    return Loan.find({ customer: customer._id }).sort({ createdAt: -1 });
  }

  /**
   * ======================================================
   * 1️⃣3️⃣ CUSTOMER → GET LOAN DETAILS
   * ======================================================
   */
  async getLoanDetails(loanId) {
    const loan = await Loan.findById(loanId)
      .populate("agent", "businessName phone")
      .populate("customer", "customerId");

    if (!loan) throw new Error("Loan not found.");

    return loan;
  }

  /**
   * ======================================================
   * 🆕 1️⃣4️⃣ SAFE — FIND CUSTOMER BY NORMALIZED PHONE
   * ======================================================
   */
  async findCustomerByPhoneNormalized(phone) {
    const normalized = normalizePhone(phone);

    const user = await User.findOne({
      phone: normalized,
      role: "customer",
    });

    if (!user) return null;

    return await Customer.findOne({ user: user._id });
  }

 
  /**
   * ======================================================
   * 🆕 1️⃣5️⃣ SAFE — ENSURE ONE CUSTOMER = ONE ACCOUNT
   * (Used during registration)
   * ======================================================
   */
  async ensureSingleCustomerAccount(phone) {
    const normalized = normalizePhone(phone);

    const existingUser = await User.findOne({
      phone: normalized,
      role: "customer",
    });

    if (existingUser) {
      throw new Error("Namba hii ya simu tayari imesajiliwa.");
    }

    return true;
  }

}

module.exports = new CustomerService();

