     
const jwt = require("jsonwebtoken");


const User = require("../models/User");
const Customer = require("../models/Customer");
const Agent = require("../models/Agent");
const BusinessCategory = require("../models/businessCategory");
const FaceBiometric = require("../models/FaceBiometric"); // 🆕 SAFE ADD
const idGenerator = require("../utils/idGenerator");
const normalizePhone = require("../utils/normalizePhone");
const pushService = require("./pushService");
const deviceService = require("./deviceService");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET not defined");
}

const JWT_SECRET = process.env.JWT_SECRET;
  
class AuthService { 

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
    JWT_SECRET,
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
   
  let { fullName, phone, pin, nationalId, biometricId, deviceId } = data;
  
   

  // 🔥 FIX YA MWISHO
  if (!nationalId || nationalId === "") {
    nationalId = null;
  }

 
  const normalized = normalizePhone(phone);
    this.validatePin(pin);

 
   
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

  
  // 4️⃣ CREATE USER
 
const customerId = idGenerator.generateCustomerID();

// build object first
 const userData = {
  fullName, 
 phone: normalized,
  pin,
  role: "customer",
  systemId: customerId,
};
// only add nationalId if exists
if (nationalId) {
  userData.nationalId = nationalId;
}

 let user;

try {
  user = await User.create(userData);
} catch (err) {
  if (err.code === 11000) {
    throw new Error("no tayari una Account huwezi  kujisajili mara mbili.");
  }
  throw err;
}

// 🔥 DEVICE LINKING (NIDA + FACE)
 if (deviceId) {
  await deviceService.linkDevice({
    deviceId,
    user,
  });
}

 
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

    const normalized = normalizePhone(phone);
this.validatePin(pin);

   const user = await User.findOne({ phoneNormalized: normalized }).select("+pin");
    if (!user) throw new Error("Akaunti haipo.");

if (!user.pin) {
  throw new Error("Authentication error.");
}
    if (user.blockedUntil && new Date() < user.blockedUntil) {
      throw new Error("Akaunti imezuiwa kwa muda.");
    }
    if (user.isBlocked || user.isLocked) {
  throw new Error("Akaunti imefungwa.");
}

   const match = await user.comparePin(pin);
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
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
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
 
     const normalized = normalizePhone(phone);

    this.validatePin(pin);
  const exists = await User.findOne({ phoneNormalized: normalized });
    if (exists) throw new Error("Namba tayari imesajiliwa.");

    const category = await BusinessCategory.findById(businessCategoryId);
    if (!category) throw new Error("Business category haipo.");

    
    const agentId = idGenerator.generateAgentID?.() || `AG-${Date.now()}`;

    const user = await User.create({
      fullName,
     phone: normalized,
      pin,
      role: "agent",
      businessName,
      businessCategory: businessCategoryId,
      systemId: agentId,
    });

    await Agent.create({
      user: user._id,
      agentId,
      normalizedPhone: normalized,
      fullName,
       phone: normalized,
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
 const normalized = normalizePhone(phone);
   
    this.validatePin(pin);
  const exists = await User.findOne({ phoneNormalized: normalized });
    if (exists) throw new Error("tayari umeshasajiliwa.");
 
    const adminId = idGenerator.generateAdminID?.() || `ADM-${Date.now()}`;

    const user = await User.create({
      fullName,
    phone: normalized,
      pin,
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

  // 1️⃣ Normalize phone correctly
  const normalized = normalizePhone(rawPhone);

  // 2️⃣ Find user
  const user = await User.findOne({ phoneNormalized: normalized });
  if (!user) return; // usionyeshe kama user haipo

  // 3️⃣ Generate code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  user.resetPinCode = crypto.createHash("sha256").update(code).digest("hex");
  user.resetPinExpiresAt = Date.now() + 5 * 60 * 1000;
  await user.save();

  // ===============================
  // PUSH NOTIFICATION
  // ===============================
  try {
    await pushService.sendToUser(user._id, {
      title: "Reset PIN",
      body: `Code yako ya kurekebisha PIN ni: ${code}`,
      type: "PIN_RESET",
      data: {
        phone: user.phone,
      },
    });
  } catch (err) {
    console.log("Push failed or no push token");
  }

  // ===============================
  // SMS FALLBACK
  // ===============================
  try {
    const smsService = require("./smsService");
    await smsService.sendSMS(normalized, `Code yako ya PIN ni: ${code}`);
  } catch (err) {
    console.log("SMS failed");
  }
}

// ======================================================
// RESET PIN
// ======================================================
 async resetPin({ rawPhone, code, newPin }) {

  const normalized = normalizePhone(rawPhone);
  this.validatePin(newPin);

  const user = await User.findOne({ phoneNormalized: normalized });

  if (!user) throw new Error("Invalid request");

  const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

  if (
    user.resetPinCode !== hashedCode ||
    user.resetPinExpiresAt < Date.now()
  ) {
    throw new Error("Code si sahihi au ime-expire");
  }

  user.pin = newPin; // acha raw
  user.resetPinCode = null;
  user.resetPinExpiresAt = null;
  await user.save();
}
}
   
  
module.exports = new AuthService();
