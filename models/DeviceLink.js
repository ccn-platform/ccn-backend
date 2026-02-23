const mongoose = require("mongoose");

const DeviceLinkSchema = new mongoose.Schema({
  deviceId: { type: String, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  phone: String,
  nationalId: String,

  linkedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["linked", "blocked"],
    default: "linked",
  },
});

module.exports = mongoose.model("DeviceLink", DeviceLinkSchema);
