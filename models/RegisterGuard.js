 const mongoose = require("mongoose");

const RegisterGuardSchema = new mongoose.Schema({
  phone: String,
  nationalId: String,
  deviceId: String,
  ip: String,

  attempts: { type: Number, default: 0 },
  blockedUntil: { type: Date, default: null },
}, { timestamps: true });


// 🔥 INDEX YA HARAKA (query fast)
RegisterGuardSchema.index({ phone: 1, nationalId: 1, deviceId: 1, ip: 1 });

// 🧹 AUTO DELETE baada ya 48h
RegisterGuardSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: 172800 }
);

module.exports = mongoose.model("RegisterGuard", RegisterGuardSchema);
