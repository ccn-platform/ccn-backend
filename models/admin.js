 // models/Admin.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    // ⭐ ADDED — link na User (haivunji old data)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      sparse: true, // ⭐ old records allowed
    },

    // ⭐ ADDED — AdminID ya mfumo
    adminId: {
      type: String,
      unique: true,
      index: true,
      sparse: true, // ⭐ hairuhusu kuvunja records za zamani
    },

    fullName: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      unique: true,
      required: true
    },

    // ⭐ ADDED — normalized phone (2557XXXXXXXX)
    normalizedPhone: {
      type: String,
      index: true,
      sparse: true
    },

    pin: {
      type: String,
      required: true
    },

    role: {
      type: String,
      default: "admin"
    },

    adminLevel: {
      type: Number,
      enum: [1, 2, 3], // 1 = normal, 2 = supervisor, 3 = super admin
      default: 1
    }
  },
  { timestamps: true }
);

// Hash pin before save (HAIJAGUSWA)
adminSchema.pre("save", async function (next) {
  if (!this.isModified("pin")) return next();
  this.pin = await bcrypt.hash(this.pin, 10);
  next();
});

// ⭐ ADDED — safe indexes (hazivunji data za zamani)
adminSchema.index(
  { adminId: 1 },
  { unique: true, sparse: true }
);

adminSchema.index(
  { normalizedPhone: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("Admin", adminSchema);
