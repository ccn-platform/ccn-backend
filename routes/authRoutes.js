  
 const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");
const registerGuard = require("../middleware/registerGuard");
const normalizePhone = require("../utils/normalizePhone");

/**
 * ======================================================
 * SAFE GLOBAL PHONE NORMALIZER
 * ======================================================
 */
router.use((req, res, next) => {
  if (req.body && req.body.phone) {
    try {
      req.body.phone = normalizePhone(req.body.phone);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
  next();
});

// ===============================
// CUSTOMER REGISTER
// ===============================
 router.post("/register/customer", registerGuard, authController.registerCustomer);

// ===============================
// AGENT REGISTER
// ===============================
router.post("/register/agent", authController.registerAgent);

// ===============================
// LOGIN
// ===============================
router.post("/login", authController.login);

// ===============================
// REFRESH TOKEN
// ===============================
router.post("/refresh", authController.refresh);

// ===============================
// FORGOT PIN
// ===============================
router.post("/forgot-pin", authController.forgotPin);

// ===============================
// RESET PIN
// ===============================
router.post("/reset-pin", authController.resetPin);

// ===============================
// AUTHENTICATED USER
// ===============================
router.get("/me", auth, authController.me);

module.exports = router;
