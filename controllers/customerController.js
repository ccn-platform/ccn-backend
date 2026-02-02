 // controllers/customerController.js

const customerService = require("../services/customerService");

class CustomerController {

  /** ============================================
   * 1️⃣ Create Customer
   * ============================================ */
  async create(req, res) {
    try {
      const customer = await customerService.createCustomer(
        req.body.userId,
        req.body
      );
      return res.status(201).json({ customer });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 2️⃣ Get Customer Profile
   * ============================================ */
  async getOne(req, res) {
    try {
      const customer = await customerService.getCustomerById(
        req.params.customerId
      );
      return res.json({ customer });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /** ============================================
   * 3️⃣ Update Customer
   * ============================================ */
  async update(req, res) {
    try {
      const updated = await customerService.updateCustomer(
        req.params.customerId,
        req.body
      );
      return res.json({ customer: updated });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 4️⃣ Add Payment
   * ============================================ */
  async addPayment(req, res) {
    try {
      const payment = await customerService.addPayment(
        req.params.customerId,
        req.body
      );
      return res.status(201).json({ payment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 5️⃣ Get ALL Payments
   * ============================================ */
  async getPayments(req, res) {
    try {
      const payments = await customerService.getPayments(
        req.params.customerId
      );
      return res.json({ payments });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /** ============================================
   * 6️⃣ Get ONE Payment
   * ============================================ */
  async getPayment(req, res) {
    try {
      const payment = await customerService.getPaymentById(
        req.params.paymentId
      );
      return res.json({ payment });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /** ============================================
   * 7️⃣ Update Payment Status
   * ============================================ */
  async updatePaymentStatus(req, res) {
    try {
      const payment = await customerService.updatePaymentStatus(
        req.params.paymentId,
        req.body.status
      );
      return res.json({ payment });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 8️⃣ Partial Payment
   * ============================================ */
  async partialPayment(req, res) {
    try {
      const updated = await customerService.partialPayment(
        req.params.paymentId,
        req.body.amount
      );
      return res.json({ updated });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 9️⃣ Payment Summary
   * ============================================ */
  async sumPayments(req, res) {
    try {
      const summary = await customerService.sumCustomerPayments(
        req.params.customerId
      );
      return res.json(summary);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 🔟 Check Loan Cleared
   * ============================================ */
  async checkLoanCleared(req, res) {
    try {
      const cleared = await customerService.checkIfLoanCleared(
        req.params.loanId
      );
      return res.json({ cleared });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 1️⃣1️⃣ Request Loan (Customer)
   * ============================================ */
  async requestLoan(req, res) {
    try {
      const loan = await customerService.requestLoanForCustomer(
        req.params.customerId,
        req.body
      );
      return res.status(201).json({ loan });
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
  }

  /** ============================================
   * 1️⃣2️⃣ Get My Loans
   * ============================================ */
  async getMyLoans(req, res) {
    try {
      const loans = await customerService.getMyLoans(
        req.params.customerId
      );
      return res.json({ loans });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /** ============================================
   * 1️⃣3️⃣ Get Loan Details
   * ============================================ */
  async getLoanDetails(req, res) {
    try {
      const loan = await customerService.getLoanDetails(
        req.params.loanId
      );
      return res.json({ loan });
    } catch (err) {
      return res.status(404).json({ message: err.message });
    }
  }

  /** ============================================
   * 🆕 1️⃣4️⃣ GET CUSTOMER BY PHONE (NORMALIZED)
   * SAFE ADDITION — no existing logic touched
   * ============================================ */
  async getByPhone(req, res) {
    try {
      const customer = await customerService.findCustomerByPhoneNormalized(
        req.params.phone
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      return res.json({
        success: true,
        customer,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new CustomerController();
