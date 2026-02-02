// routes/payoutRoutes.js

const express = require("express");
const router = express.Router();

const payoutController = require("../controllers/payoutController");
 const auth = require("../middleware/authMiddleware");

/**
 * ======================================================
 * PAYOUT ROUTES (AGENT)
 * ======================================================
 */

// CREATE PAYOUT ACCOUNT
router.post(
  "/agents/me/payout-accounts",
  auth,
  payoutController.createPayoutAccount
);

// GET ALL PAYOUT ACCOUNTS
router.get(
  "/agents/me/payout-accounts",
  auth,
  payoutController.getMyPayoutAccounts
);

// GET PRIMARY PAYOUT ACCOUNT
router.get(
  "/agents/me/payout-accounts/primary",
  auth,
  payoutController.getPrimaryPayoutAccount
);

// SET PRIMARY PAYOUT ACCOUNT
router.patch(
  "/agents/me/payout-accounts/:id/primary",
  auth,
  payoutController.setPrimary
);

// DEACTIVATE PAYOUT ACCOUNT
router.delete(
  "/agents/me/payout-accounts/:id",
  auth,
  payoutController.deactivate
);

module.exports = router;
