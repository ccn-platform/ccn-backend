 const mongoose = require("mongoose");

const FaceBiometricSchema = new mongoose.Schema(
  {
    // 🔗 User link (after successful registration)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true, // allows null before linking
      index: true,
    },

    // 🔐 Hash ya uso (immutable identity)
    faceHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // 🧠 Face vector (for similarity check)
    // Stored but not returned in queries
    faceVector: {
      type: [Number],
      required: true,
      select: false,
    },

    // 🔍 Liveness confidence score
    livenessScore: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    // 🟡 Lifecycle state
    status: {
      type: String,
      enum: ["pending", "linked"],
      default: "pending",
      index: true,
    },

    // ⏳ Auto-delete unlinked biometrics
    expiresAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Ensure only one biometric per user
FaceBiometricSchema.index({ userId: 1 }, { unique: true, sparse: true });

// 🔍 Faster search by faceHash
FaceBiometricSchema.index({ faceHash: 1 });

module.exports = mongoose.model("FaceBiometric", FaceBiometricSchema);
