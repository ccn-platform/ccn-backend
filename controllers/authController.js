  const authService = require("../services/authService");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ SAFE
const Logger = require("../services/loggerService"); // 🆕 ADD ONLY — SAFE

class AuthController {
  /**
   * ======================================================
   * REGISTER CUSTOMER (NIDA or FACE)
   * ======================================================
   */
  async registerCustomer(req, res) {
    try {
      // -----------------------------
      // Normalize phone (extra safety)
      // -----------------------------
      if (req.body.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }

      // -----------------------------
      // 🆕 SAFE GUARD: biometricId
      // -----------------------------
      if (
        req.body.biometricId &&
        typeof req.body.biometricId !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid biometricId format",
        });
      }

      const result = await authService.registerCustomer(req.body);

      return res.status(201).json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      Logger.warn("AUTH_REGISTER_CUSTOMER_FAILED", {
        phone: req.body?.phone || null,
        reason: err.message,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * LOGIN
   * ======================================================
   */
  async login(req, res) {
    try {
      if (req.body.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }

      const result = await authService.loginWithPin(req.body);

      return res.json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      Logger.warn("AUTH_LOGIN_FAILED", {
        phone: req.body?.phone || null,
        reason: err.message,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * REFRESH TOKEN
   * ======================================================
   */
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: "Refresh token required",
        });
      }

      const tokens = await authService.refreshToken(refreshToken);

      return res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } catch (err) {
      Logger.warn("AUTH_REFRESH_FAILED", {
        reason: err.message,
        ip: req.ip,
      });

      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * AUTHENTICATED USER
   * ======================================================
   */
  async me(req, res) {
    return res.json({
      success: true,
      user: req.user,
    });
  }

  /**
   * ======================================================
   * REGISTER AGENT (UNCHANGED)
   * ======================================================
   */
  async registerAgent(req, res) {
    try {
      if (req.body.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }

      const result = await authService.registerAgent(req.body);

      return res.status(201).json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
    } catch (err) {
      Logger.warn("AUTH_REGISTER_AGENT_FAILED", {
        phone: req.body?.phone || null,
        reason: err.message,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * FORGOT PIN
   * ======================================================
   */
  async forgotPin(req, res) {
    try {
      const { phone } = req.body;
      await authService.sendResetPinCode(phone);

      return res.json({
        success: true,
        message: "Kama namba ipo, code imetumwa",
      });
    } catch (err) {
      Logger.warn("AUTH_FORGOT_PIN_FAILED", {
        phone: req.body?.phone || null,
        reason: err.message,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  /**
   * ======================================================
   * RESET PIN
   * ======================================================
   */
  async resetPin(req, res) {
    try {
      const { phone, code, newPin } = req.body;

      await authService.resetPin({
        rawPhone: phone,
        code,
        newPin,
      });

      return res.json({
        success: true,
        message: "PIN imebadilishwa kikamilifu",
      });
    } catch (err) {
      Logger.warn("AUTH_RESET_PIN_FAILED", {
        phone: req.body?.phone || null,
        reason: err.message,
        ip: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }
}

module.exports = new AuthController();
