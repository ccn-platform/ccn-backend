 const RegisterGuard = require("../models/RegisterGuard");

module.exports = async function (req, res, next) {
  try {
    const phone = req.body.phone || "no-phone";
    const nationalId = req.body.nationalId || "no-nida";
    const deviceId = req.body.deviceId || "no-device";
    const ip = req.ip || "no-ip";

    let guard = await RegisterGuard.findOne({
      phone,
      nationalId,
      deviceId,
      ip,
    });

    if (!guard) {
      guard = await RegisterGuard.create({
        phone,
        nationalId,
        deviceId,
        ip,
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
