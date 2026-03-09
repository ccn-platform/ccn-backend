  const authService = require("../services/authService");
const User = require("../models/User");
 const normalizePhone = require("../utils/normalizePhone"); // ⭐ SAFE
const isNameTooSimilar = require("../utils/nameSimilarity");
const Logger = require("../services/loggerService"); // 🆕 ADD ONLY — SAFE
 // =============================================
// 🇹🇿 FULL NAME VALIDATION (LOAN PLATFORM LEVEL)
// =============================================
function validateFullNameTZ(fullName) {
  if (!fullName || typeof fullName !== "string") {
    throw new Error("Jina kamili linahitajika");
  }

  const cleaned = fullName.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(" ");

  // 🔴 lazima majina 3+
  if (parts.length < 3) {
    throw new Error("Tafadhali andika majina matatu kamili (kama yalivyo kwenye kitambulisho)");
  }

  for (const name of parts) {
    // herufi tu
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(name)) {
      throw new Error("Majina yasitumie namba au alama andika kama yalivyo kwenye kitambulisho");
    }

    // minimum 3 letters
    if (name.length < 3) {
      throw new Error("rekebisha jina  liwe kamili kama lilivyo kwenye  kitambulisho");
    }

    // lazima iwe na vowel → zuia KJMH
    if (!/[aeiouAEIOU]/.test(name)) {
      throw new Error("Tafadhali andika majina halisi, si vifupisho kama lilivyo kwenye kitambulisho");
    }

    // zuia majina fake kama AAAA
    if (/^(.)\1+$/.test(name)) {
      throw new Error("Jina linaonekana si halisi weka kama lilivyo kwenye kitambulisho");
    }
  }

  // 🔤 AUTO CAPITALIZE
  return cleaned
    .split(" ")
    .map(n => n.charAt(0).toUpperCase() + n.slice(1).toLowerCase())
    .join(" ");
}

// 🔥 ADD HAPA JUU YA FILE
 function normalizeNida(nida) {
  if (!nida) throw new Error("NIDA required");

  const digits = String(nida).replace(/-/g, "");

  // lazima iwe digits tu
  if (!/^\d+$/.test(digits)) {
    throw new Error("NIDA si sahihi");
  }

  // lazima ianze na 19 au 20
  if (!(digits.startsWith("19") || digits.startsWith("20"))) {
    throw new Error("NIDA sio sahihi weka namba ya nida iliyosahihi");
  }

  // =========================
  // OLD NIDA → 16 digits
  // =========================
  if (digits.length === 16) {
    return `${digits.slice(0,4)}-${digits.slice(4,9)}-${digits.slice(9,14)}-${digits.slice(14)}`;
  }

  // =========================
  // NEW NIDA → 20 digits
  // =========================
  if (digits.length === 20) {
    return `${digits.slice(0,8)}-${digits.slice(8,13)}-${digits.slice(13,18)}-${digits.slice(18)}`;
  }

  // nyingine zote = kosa
  throw new Error("NIDA si  sahihi ");
}


class AuthController {
  /**
   * ======================================================
   * REGISTER CUSTOMER (NIDA or FACE)
   * ======================================================
   */
  async registerCustomer(req, res) {
    console.log("🔥 REGISTER CONTROLLER HIT");
console.log("BODY:", req.body);
    try {

      // ===============================
// FULL NAME VALIDATION
// ===============================
const guard = req.registerGuard || null;
  try {
  req.body.fullName = validateFullNameTZ(req.body.fullName);
} catch (e) {
  return res.status(400).json({
    success: false,
    message: e.message,
  });
}
 // ===============================
// NAME SIMILARITY CHECK (ANTI FRAUD)
// ===============================
const parts = req.body.fullName.split(" ");

const possibleUsers = await User.find({
  fullName: { $regex: `^${parts[0]}`, $options: "i" }
}).limit(10);

for (const u of possibleUsers) {

  if (isNameTooSimilar(u.fullName, req.body.fullName)) {

    if (guard) {
      guard.attempts += 1;

      if (guard.attempts >= 2) {
        guard.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await guard.save();
      }
    }

    return res.status(400).json({
      success: false,
      message: "Majina haya yanafanana sana na account iliyopo."
    });
  }
}
      
      // -----------------------------
      // Normalize phone (extra safety)
      // -----------------------------
      if (req.body.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }

      // ===============================
// 🚨 FRAUD CONTROL → FACE kutumia phone iliyopo
// ===============================
 
 // 🚫 CHECK kama tayari blocked
if (guard && guard.blockedUntil && new Date() < guard.blockedUntil) {
  return res.status(429).json({
    success: false,
    message: "Umezuiwa kwa saa 24. Jaribu tena kesho.",
  });
}

 if (req.body.biometricId && req.body.phone) {

  const normalizedPhone = req.body.phone;
  const existingUser = await User.findOne({
    phoneNormalized: normalizedPhone
  });

  if (existingUser) {

    // =========================================
    // 🔴 CASE 1: phone ilishasajiliwa kwa NIDA
    // =========================================
    if (existingUser.nationalId) {

      if (guard) {
        guard.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await guard.save();
      }

      return res.status(429).json({
        success: false,
        message: " tayari umesha sajiliwa kwa NIDA. Umezuiwa masaa 24.",
      });
    }

    // =========================================
    // 🟡 CASE 2: phone ilishasajiliwa kwa FACE
    // =========================================
    if (!existingUser.nationalId) {

      if (guard) {
        guard.attempts += 1;

        // mara ya pili → block
        if (guard.attempts >= 2) {
          guard.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
          await guard.save();

          return res.status(429).json({
            success: false,
            message: "Jaribio la pili. Umezuiwa kwa masaa 24.",
          });
        }

        await guard.save();
      }

      return res.status(400).json({
        success: false,
        message: "inaonekana tayari upo kwenye mfumo . Jaribu tena mara moja tu.",
      });
    }
  }
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
 // ===============================
// NIDA GUARD START
// ===============================
 // ===============================
// NIDA GUARD START
// ===============================
 
if (req.body.nationalId) {

  try {
    req.body.nationalId = normalizeNida(req.body.nationalId);

    const existingNida = await User.findOne({
  nationalId: req.body.nationalId
});

if (existingNida) {
  return res.status(400).json({
    success: false,
    message: " tayari umeshasajiliwa kwenye mfumo.",
  });
}
    
  } catch (e) {
    if (guard) {
      guard.attempts += 1;

      if (guard.attempts >= 2) {
        guard.blockedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      }

      await guard.save();
    }

    return res.status(400).json({
      success: false,
      message: "NIDA si sahihi",
    });
  }

  // 🚫 block check
  if (guard && guard.blockedUntil && new Date() < guard.blockedUntil) {
    return res.status(429).json({
      success: false,
      message: "Umezuiwa kwa saa 24. Jaribu kesho.",
    });
  }
}


      const result = await authService.registerCustomer(req.body);
 
    // ===============================
    // RESET GUARD AFTER SUCCESS
    // ===============================
    if (guard) {
       guard.attempts = 0;
       guard.blockedUntil = null;
       await guard.save();
      }

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
