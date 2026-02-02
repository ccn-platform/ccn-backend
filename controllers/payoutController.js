// controllers/payoutController.js

const payoutService = require("../services/payoutService");

/**
 * ======================================================
 * PAYOUT CONTROLLER
 * ======================================================
 * - Inapokea request kutoka routes
 * - Inaita payoutService
 * - Inarudisha response safi
 * ======================================================
 */

class PayoutController {
  /**
   * ======================================================
   * CREATE PAYOUT ACCOUNT
   * POST /agents/me/payout-accounts
   * ======================================================
   */
  async createPayoutAccount(req, res) {
    try {
     const agentId = req.user.agentId; // ✅ SAHIHI

      const payout = await payoutService.createPayoutAccount(
        agentId,
        req.body
      );

      return res.status(201).json({
        success: true,
        message: "Payout account imehifadhiwa",
        data: payout,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * GET ALL PAYOUT ACCOUNTS
   * GET /agents/me/payout-accounts
   * ======================================================
   */
  async getMyPayoutAccounts(req, res) {
    try {
       const agentId = req.user.agentId;

      const accounts =
        await payoutService.getAgentPayoutAccounts(agentId);

      return res.json({
        success: true,
        data: accounts,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * GET PRIMARY PAYOUT ACCOUNT
   * GET /agents/me/payout-accounts/primary
   * ======================================================
   */
  async getPrimaryPayoutAccount(req, res) {
    try {
       const agentId = req.user.agentId;

      const account =
        await payoutService.getPrimaryPayoutAccount(agentId);

      return res.json({
        success: true,
        data: account,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * SET PRIMARY PAYOUT ACCOUNT
   * PATCH /agents/me/payout-accounts/:id/primary
   * ======================================================
   */
  async setPrimary(req, res) {
    try {
       const agentId = req.user.agentId;

      const payoutId = req.params.id;

      const payout =
        await payoutService.setPrimaryPayoutAccount(
          agentId,
          payoutId
        );

      return res.json({
        success: true,
        message: "Akaunti imewekwa kuwa primary",
        data: payout,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * DEACTIVATE PAYOUT ACCOUNT
   * DELETE /agents/me/payout-accounts/:id
   * ======================================================
   */
  async deactivate(req, res) {
    try {
       const agentId = req.user.agentId;

      const payoutId = req.params.id;

      await payoutService.deactivatePayoutAccount(
        agentId,
        payoutId
      );

      return res.json({
        success: true,
        message: "Payout account imeondolewa",
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new PayoutController();
