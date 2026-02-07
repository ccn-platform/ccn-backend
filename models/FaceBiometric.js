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

    // 🔐 Unique face hash
    faceHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 🖼️ TEMP FACE IMAGE (only during registration)
    faceImage: {
      type: String,
      required: false,
      select: false, // haitarudi kwenye query
    },

    // 🧠 optional future
    faceVector: {
      type: [Number],
      required: false,
      select: false,
    },

    // 🔍 optional
    livenessScore: {
      type: Number,
      required: false,
      min: 0,
      max: 1,
    },

    // 🟡 lifecycle
    status: {
      type: String,
      enum: ["pending", "linked"],
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

FaceBiometricSchema.index({ userId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("FaceBiometric", FaceBiometricSchema);
