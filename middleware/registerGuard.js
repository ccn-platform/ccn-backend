  const RegisterGuard = require("../models/RegisterGuard");

module.exports = async function (req, res, next) {
  try {

    const queries = [];

    if (req.body.deviceId) {
      queries.push({ deviceId: req.body.deviceId });
    }

    if (req.body.nationalId) {
      queries.push({ nationalId: req.body.nationalId });
    }

    if (req.body.phone) {
      queries.push({ phone: req.body.phone });
    }

    let guard = null;

    if (queries.length > 0) {
      guard = await RegisterGuard.findOne({ $or: queries });
    }

    if (!guard) {
      guard = await RegisterGuard.create({
        phone: req.body.phone || null,
        nationalId: req.body.nationalId || null,
        deviceId: req.body.deviceId || null,
        ip: req.ip,
      });
    }

    // 🚫 block check
    if (guard.blockedUntil && new Date() < guard.blockedUntil) {
      return res.status(429).json({
        success: false,
        message: "Umezuiwa kwa saa 24. Jaribu kesho.",
      });
    }

    req.registerGuard = guard;
    next();

  } catch (err) {
    next(err);
  }
};
