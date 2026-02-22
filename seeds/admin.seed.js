  /**
 * ======================================================
 * INITIAL ADMIN SEED (ONE-TIME)
 * ======================================================
 */

const mongoose = require("mongoose");
require("dotenv").config();

const AuthService = require("../services/authService");
const User = require("../models/User");

// ⭐ CHUKUA URI SAHIHI
const MONGO_URI =
  process.env.NODE_ENV === "production"
    ? process.env.MONGO_URI_ATLAS
    : process.env.MONGO_URI_ATLAS || process.env.MONGO_URI;

async function seedAdmin() {
  try {
    if (!MONGO_URI) {
      throw new Error("Mongo URI haipo kwenye .env");
    }

    await mongoose.connect(MONGO_URI);

    // ✅ TAARIFA ZAKO
    const adminPhone = "0758078629";
    const adminPin = "1234";
    const adminName = "Ibrahim Hassani Ntahondi";

    // 🔒 Hakikisha admin hajatengenezwa tayari
    const existingAdmin = await User.findOne({
      phone: adminPhone,
      role: "admin",
    });

    if (existingAdmin) {
      console.log("✅ Admin tayari yupo. Hakuna kilichofanyika.");
      process.exit(0);
    }

    const result = await AuthService.registerAdmin({
      fullName: adminName,
      phone: adminPhone,
      pin: adminPin,
    });

    console.log("✅ ADMIN AMETENGENEZWA KWA MAFANIKIO");
    console.log({
      systemId: result.user.systemId,
      fullName: result.user.fullName,
      phone: result.user.phone,
      role: result.user.role,
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ ADMIN SEED IMESHINDWA:", err.message);
    process.exit(1);
  }
}

seedAdmin();
