  const mongoose = require("mongoose");

const FaceBiometricSchema = new mongoose.Schema(
  {
    // 🔗 Link to user after registration
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      index: true,
    },

    // 📱 Device lock
    deviceId: {
      type: String,
       required: true,
      index: true,
    },

    // 🖼️ TEMP FACE IMAGE (only during registration)
    faceImage: {
      type: String,
      select: false,
    },

    // 🧠 optional future embedding
    faceVector: {
      type: [Number],
      select: false,
    },

    // 🔍 optional liveness
    livenessScore: {
      type: Number,
      min: 0,
      max: 1,
    },

    // 🟡 lifecycle
    status: {
      type: String,
      enum: ["pending", "processing", "linked"],
      default: "pending",
      index: true,
    },

    // ⏳ auto delete pending
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  { timestamps: true }
);
FaceBiometricSchema.index(
  { deviceId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "linked" } }
);

module.exports = mongoose.model("FaceBiometric", FaceBiometricSchema);
