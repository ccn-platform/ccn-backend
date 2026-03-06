   const paymentService = require("../services/paymentService");
 const Agent = require("../models/Agent");
 const Loan = require("../models/Loan");
 const Revenue = require("../models/Revenue");


class PaymentController {
  /**
 * ======================================================
 * CUSTOMER / AGENT PAYMENT
 * ======================================================
 */
async makePayment(req, res) {
  try {
    const { loanId, amount, customerId: bodyCustomerId } = req.body;

    // ✅ Hakiki input za msingi
    if (!loanId || !amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "loanId na amount vinahitajika",
      });
    }

    let customerId = null;

    // ===============================
    // 1️⃣ MTEJA ANALIPA MWENYEWE
    // ===============================
    if (req.user.role === "customer") {
       customerId = req.user.userId;
     }

    // ===============================
    // 2️⃣ WAKALA ANALIPIA MTEJA
    // ===============================
    if (req.user.role === "agent") {
      if (!bodyCustomerId) {
        return res.status(400).json({
          success: false,
          message: "customerId inahitajika kwa malipo ya wakala",
        });
      }
      customerId = bodyCustomerId;
    }

    // ✅ HAKIKI MWISHO
    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: "Customer ID haijapatikana",
      });
    }

    // ===============================
    // FANYA MALIPO
    // ===============================
    const result = await paymentService.makePayment({
      loanId,
      customerId,
      amount,
    });

    return res.status(200).json({
      success: true,
      message: "Malipo yamefanikiwa",
      data: result,
    });

  } catch (error) {
    console.error("PAYMENT ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Malipo yameshindwa",
    });
  }
}


  /**
   * ======================================================
   * PAY LOAN FEE (AGENT ONLY)
   * ======================================================
   */
     async payLoanFee(req, res) {
  try {
    console.log("➡️ PAY LOAN FEE START");

     const { loanId, amountPaid } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: "loanId inahitajika",
      });
    }

    // ===== 1️⃣ Hakikisha agent yupo =====
    const agentId = req.user.agentId;
    console.log("🔑 Agent ID from token:", agentId);

    if (!agentId) {
      return res.status(403).json({
        success: false,
        message: "Agent hajathibitishwa",
      });
    }

    // ===== 2️⃣ Pata mkopo =====
    const loan = await Loan.findById(loanId);
    console.log("📄 Loan found:", loan?._id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Mkopo haukupatikana",
      });
    }

    // ===== 3️⃣ Hakiki ownership =====
    console.log("👤 Loan.agent:", String(loan.agent));
    console.log("👤 Request.agent:", String(agentId));

    if (String(loan.agent) !== String(agentId)) {
      return res.status(403).json({
        success: false,
        message: "Huna ruhusa ya kulipa ada ya mkopo huu",
      });
    }

    // ===== 4️⃣ Hakiki hali ya mkopo =====
    if (loan.feePaid === true) {
      return res.status(400).json({
        success: false,
        message: "Ada tayari imelipwa",
      });
    }

     // 🚫 Hairuhusiwi kama tayari PAID
if (loan.status === "paid") {
  return res.status(400).json({
    success: false,
    message: "Mkopo tayari umelipwa",
  });
}

// ✅ RUHUSU ADA KULIPWA TU KWA ACTIVE AU OVERDUE
if (!["active", "overdue"].includes(loan.status)) {
  return res.status(400).json({
    success: false,
    message: "Ada inaweza kulipwa tu kwa mkopo ulio ACTIVE au OVERDUE",
  });
}
const result = await paymentService.payLoanFee(agentId, loanId, amountPaid);

console.log("✅ Loan fee paid successfully");

return res.status(200).json({
  success: true,
  message: result.message,
});
  
  } catch (error) {
    console.error("❌ PAY FEE ERROR:", error);
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}
  /**
 * ======================================================
 * AGENT ADJUST / SETTLE LOAN (NO CUSTOMER PAYMENT)
 * ======================================================
 */
async agentAdjustLoan(req, res) {
  try {
    const { loanId, adjustAmount, reason } = req.body;

    // ===============================
    // 🔐 AUTH: AGENT ONLY
    // ===============================
    if (req.user.role !== "agent") {
      return res.status(403).json({
        success: false,
        message: "Huduma hii inaruhusiwa kwa wakala tu",
      });
    }

    const agentId = req.user.agentId;
    if (!agentId) {
      return res.status(403).json({
        success: false,
        message: "Agent hajathibitishwa",
      });
    }

    // ===============================
    // 🛡️ INPUT VALIDATION
    // ===============================
    if (!loanId || !adjustAmount || Number(adjustAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "loanId na adjustAmount vinahitajika",
      });
    }

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Sababu ya adjustment inahitajika (angalau herufi 5)",
      });
    }

    // ===============================
    // 🔥 CALL SERVICE
    // ===============================
    const result = await paymentService.agentAdjustLoan({
      agentId,
      loanId,
      adjustAmount: Number(adjustAmount),
      reason,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });

  } catch (error) {
    console.error("❌ AGENT ADJUST LOAN ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Adjustment imeshindikana",
    });
  }
}


  /**
   * ======================================================
   * PAYMENT CALLBACK (MOBILE MONEY / GATEWAY)
   * ======================================================
   */
  async processPayment(req, res) {
    try {
      const result = await paymentService.processPayment(req.body);

      return res.status(200).json({
        success: true,
        message: "Payment processed successfully",
        data: result,
      });
    } catch (error) {
      console.error("PAYMENT CALLBACK ERROR:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * ======================================================
   * ADMIN / TEST PAYMENT
   * ======================================================
   */
  async testPayment(req, res) {
    try {
      const { loanId, customerId, amount } = req.body;

      if (!loanId || !customerId || !amount) {
        return res.status(400).json({
          success: false,
          message: "loanId, customerId na amount vinahitajika",
        });
      }

      const result = await paymentService.makePayment({
        loanId,
        customerId,
        amount,
      });

      return res.status(200).json({
        success: true,
        message: "Test payment successful",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = new PaymentController();    
