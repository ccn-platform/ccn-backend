  // routes/userRoutes.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const normalizePhone = require("../utils/normalizePhone");

// 🛡️ MIDDLEWARES
const auth = require("../middleware/authMiddleware");
const roles = require("../middleware/roleMiddleware");
const logger = require("../middleware/requestLogger");
const rateLimiter = require("../middleware/rateLimiter");
const securityHeaders = require("../middleware/securityHeaders");
const ipBlocker = require("../middleware/ipBlocker");

// =====================================================
// ⭐ SAFE PHONE NORMALIZER MIDDLEWARE
// =====================================================
function normalizePhoneMiddleware(req, res, next) {
  try {
    if (req.body && req.body.phone) {
      req.body.phone = normalizePhone(req.body.phone);
    }
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
}

// =====================================================
// APPLY GLOBAL MIDDLEWARES
// =====================================================
router.use(logger);
router.use(securityHeaders);

// =======================
// 0️⃣ SEARCH USERS
// =======================
router.get(
  "/search",
  auth,
  roles("admin"),
  rateLimiter,
  userController.list
);

// =======================
// 1️⃣ CREATE USER
// =======================
router.post(
  "/",
  auth,
  roles("admin"),
  rateLimiter,
  normalizePhoneMiddleware,
  userController.create
);

// =======================
// 2️⃣ GET USER BY ID
// =======================
router.get(
  "/:id",
  auth,
  roles("admin", "agent", "customer"),
  userController.getOne
);

// =======================
// 3️⃣ UPDATE USER
// =======================
 router.put(
  "/:id",
  auth,
  roles("admin", "customer", "agent"),
  rateLimiter,
  normalizePhoneMiddleware,
  userController.update
);

// =======================
// 4️⃣ DELETE USER
// =======================
router.delete(
  "/:id",
  auth,
  roles("admin"),
  ipBlocker,
  userController.delete
);

// =======================
// 5️⃣ CHANGE PIN
// =======================
router.put(
  "/:id/change-pin",
  auth,
  roles("customer"),
  rateLimiter,
  userController.changePin
);

// =======================
// 6️⃣ SAVE PUSH TOKEN
// =======================
 router.post(
  "/save-push-token",
  auth,
  roles("customer", "agent"),
  userController.savePushToken
);

// =======================
// 9️⃣ REQUEST ACCOUNT DELETE (PLAY STORE REQUIRED)
// =======================
 router.post(
  "/delete-account-request",
  auth,
  roles("customer", "agent"),
  userController.requestDeleteAccount
);


module.exports = router;
