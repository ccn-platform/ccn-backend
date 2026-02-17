  const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


const User = require("../models/User");
const Customer = require("../models/Customer");
const Agent = require("../models/Agent");
const BusinessCategory = require("../models/businessCategory");
const FaceBiometric = require("../models/FaceBiometric"); // 🆕 SAFE ADD
const idGenerator = require("../utils/idGenerator");
const normalizePhone = require("../utils/normalizePhone");
const crypto = require("crypto");
const pushService = require("./pushService");

const JWT_SECRET = process.env.JWT_SECRET || "changeThisSecret";

class AuthService {
   validatePhone(phone) {
  // normalizePhone tayari inafanya validation kamili
  // kama phone si sahihi, itatupa error yenye message sahihi
  normalizePhone(phone);
}

  

  validatePin(pin) {
    if (!/^\d{4,6}$/.test(pin)) {
      throw new Error("PIN lazima iwe namba kati ya tarakimu 4 hadi 6.");
    }
  }

  /**
   * ======================================================
   * TOKEN GENERATION
   * ======================================================
   */
  generateTokens(user) {
    const accessToken = jwt.sign(
      {
        userId: user._id,
        systemId: user.systemId,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      JWT_SECRET + "_REFRESH",
      { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
  }

  /**
   * ======================================================
   * REGISTER CUSTOMER (NIDA or NON-NIDA)
   * ======================================================
   * - phone uniqueness
   * - nationalId uniqueness
   * - biometric handled separately (SAFE)
   */
  async registerCustomer(data) {
  let { fullName, phone, pin, nationalId, biometricId } = data;

  phone = normalizePhone(phone);

  this.validatePhone(phone);
  this.validatePin(pin);

  // ===============================
  // 1️⃣ PHONE DUPLICATE
  // ===============================
  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    throw new Error("no tayari una account huwezi kujisajili mara mbili.");
  }

  // ===============================
  // 2️⃣ NIDA DUPLICATE
  // ===============================
  if (nationalId) {
    const nidaExists = await User.findOne({ nationalId });
    if (nidaExists) {
      throw new Error("N tayari una account huwezi kujisajili mara mbili.");
    }
  }

  // ===============================
  // 3️⃣ FACE DUPLICATE
  // ===============================
  if (biometricId) {
    const biometric = await FaceBiometric.findById(biometricId);

    if (!biometric) {
      throw new Error("Biometric session invalid.");
    }

    if (biometric.userId) {
      throw new Error("Face hii tayari ina account.");
    }
  }

  // ===============================
  // 4️⃣ CREATE USER
  // ===============================
  const hashedPin = await bcrypt.hash(pin, 10);
  const customerId = idGenerator.generateCustomerID();

  const user = await User.create({
    fullName,
    phone,
    pin: hashedPin,
    nationalId: nationalId || null,
    role: "customer",
    systemId: customerId,
  });

  await Customer.create({
    user: user._id,
    customerId,
  });

  // ===============================
  // 5️⃣ ATTACH FACE
  // ===============================
  if (biometricId) {
    const biometricService = require("./biometricService");

    const biometric = await FaceBiometric
     .findById(biometricId)
     .select("+faceImage");


    if (!biometric || !biometric.faceImage) {
       throw new Error("Biometric image missing");
      }

    await biometricService.attachBiometricToUser({
      biometricId,
      userId: user._id,
      imageBase64: biometric.faceImage,   // ⭐ muhimu
    });
  }

  const tokens = this.generateTokens(user);
  return { user, ...tokens };
}


  /**
   * ======================================================
   * LOGIN
   * ======================================================
   */
  async loginWithPin({ phone, pin }) {
    phone = normalizePhone(phone);

    this.validatePhone(phone);
    this.validatePin(pin);

    const user = await User.findOne({ phone });
    if (!user) throw new Error("Akaunti haipo.");

    if (user.blockedUntil && new Date() < user.blockedUntil) {
      throw new Error("Akaunti imezuiwa kwa muda.");
    }

    const match = await bcrypt.compare(pin, user.pin);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= 5) {
        user.blockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      }

      await user.save();
      throw new Error("PIN sio sahihi.");
    }

    user.loginAttempts = 0;
    user.blockedUntil = null;
    user.lastLogin = new Date();
    await user.save();

    const tokens = this.generateTokens(user);

    let onboardingStep = null;
    if (user.role === "agent") {
      const agent = await Agent.findOne({ user: user._id }).select("onboardingStep");
      onboardingStep = agent?.onboardingStep || "PAYOUT_REQUIRED";
    }

    return {
      user,
      onboardingStep,
      ...tokens,
    };
  }

  /**
   * ======================================================
   * REFRESH TOKEN
   * ======================================================
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET + "_REFRESH");
      const user = await User.findById(decoded.userId);
      if (!user) throw new Error("User not found.");
      return this.generateTokens(user);
    } catch {
      throw new Error("Refresh token is invalid or expired.");
    }
  }

  /**
   * ======================================================
   * AGENT / ADMIN (UNCHANGED)
   * ======================================================
   */
  async registerAgent(data) {
    let { fullName, phone, pin, businessName, businessCategoryId } = data;

    phone = normalizePhone(phone);
    this.validatePhone(phone);
    this.validatePin(pin);

    const exists = await User.findOne({ phone });
    if (exists) throw new Error("Namba tayari imesajiliwa.");

    const category = await BusinessCategory.findById(businessCategoryId);
    if (!category) throw new Error("Business category haipo.");

    const hashedPin = await bcrypt.hash(pin, 10);
    const agentId = idGenerator.generateAgentID?.() || `AG-${Date.now()}`;

    const user = await User.create({
      fullName,
      phone,
      pin: hashedPin,
      role: "agent",
      businessName,
      businessCategory: businessCategoryId,
      systemId: agentId,
    });

    await Agent.create({
      user: user._id,
      agentId,
      normalizedPhone: phone,
      fullName,
      phone,
      pin: hashedPin,
      businessName,
      businessCategory: businessCategoryId,
      isVerified: false,
      status: "active",
    });

    const tokens = this.generateTokens(user);
    return { user, onboardingStep: "PAYOUT_REQUIRED", ...tokens };
  }

  async registerAdmin(data) {
    let { fullName, phone, pin } = data;

    phone = normalizePhone(phone);
    this.validatePhone(phone);
    this.validatePin(pin);

    const exists = await User.findOne({ phone });
    if (exists) throw new Error("Namba tayari imesajiliwa.");

    const hashedPin = await bcrypt.hash(pin, 10);
    const adminId = idGenerator.generateAdminID?.() || `ADM-${Date.now()}`;

    const user = await User.create({
      fullName,
      phone,
      pin: hashedPin,
      role: "admin",
      systemId: adminId,
    });

    const tokens = this.generateTokens(user);
    return { user, ...tokens };
  }
// ======================================================
// SEND RESET PIN CODE
// ======================================================
async sendResetPinCode(rawPhone) {
  const phone = rawPhone;
  this.validatePhone(phone);

  const user = await User.findOne({ phone });
  if (!user) return; // usionyeshe kama user haipo

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPinCode = crypto.createHash("sha256").update(code).digest("hex");
  user.resetPinExpiresAt = Date.now() + 5 * 60 * 1000;
  await user.save();

  // ===============================
  // PUSH NOTIFICATION (ikiwa ipo)
  // ===============================
  try {
    await pushService.sendToUser(user._id, {
      title: "Reset PIN",
      body: `Code yako ya kurekebisha PIN ni: ${code}`,
      type: "PIN_RESET",
    });
  } catch (err) {
    console.log("Push failed or no push token");
  }

  // ===============================
  // SMS FALLBACK
  // ===============================
  try {
    const smsService = require("./smsService"); // hakikisha file ipo
    await smsService.sendSMS(phone, `Code yako ya PIN ni: ${code}`);
  } catch (err) {
    console.log("SMS failed");
  }
}


// ======================================================
// RESET PIN
// ======================================================
async resetPin({ rawPhone, code, newPin }) {
  const phone = rawPhone;
  this.validatePhone(phone);
  this.validatePin(newPin);

  const user = await User.findOne({ phone });
  if (!user) throw new Error("Invalid request");

  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  if (
    user.resetPinCode !== hashedCode ||
    user.resetPinExpiresAt < Date.now()
  ) {
    throw new Error("Code si sahihi au ime-expire");
  }

  user.pin = await bcrypt.hash(newPin, 10);
  user.resetPinCode = null;
  user.resetPinExpiresAt = null;
  await user.save();
}
}
   
  
module.exports = new AuthService();
