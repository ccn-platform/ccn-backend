 // services/userService.js

const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const idGenerator = require("../utils/idGenerator");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ ADDED

class UserService {
  
  /**
   * ======================================================
   * 1️⃣ Create New User (Customer / Agent / Admin)
   * ======================================================
   */
  async createUser(data) {
    let { fullName, phone, role, pin } = data;

    // ⭐ NEW — normalize phone (ONE LINE, SAFE)
    phone = normalizePhone(phone);

    // Check duplicates (NOW SAFE FOR MILLIONS)
    const exists = await User.findOne({ phone });
    if (exists) throw new Error("Hii namba ya simu tayari imesajiliwa.");

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Generate system ID automatically
    const systemId =
      role === "customer"
        ? idGenerator.generateCustomerID()
        : role === "agent"
        ? idGenerator.generateAgentID()
        : idGenerator.generateAdminID();

    // Create user
    const user = await User.create({
      ...data,
      phone,                 // ⭐ normalized phone
      phoneNormalized: phone, // ⭐ optional safe duplication
      systemId,
      pin: hashedPin,
    });

    return user;
  }

  /**
   * ======================================================
   * 2️⃣ Get User by ID
   * ======================================================
   */
  async getUserById(userId) {
    const user = await User.findById(userId)
      .populate("merchantData")
      .populate("businessCategory");

    if (!user) throw new Error("User not found.");
    return user;
  }

  /**
   * ======================================================
   * 3️⃣ Update User Details
   * ======================================================
   */
  async updateUser(userId, updateData) {
    // ⭐ SAFE ADDITION — normalize phone if updating phone
    if (updateData.phone) {
      updateData.phone = normalizePhone(updateData.phone);
      updateData.phoneNormalized = updateData.phone;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) throw new Error("User not found.");
    return user;
  }

  /**
   * ======================================================
   * 4️⃣ Change PIN
   * ======================================================
   */
  async changePin(userId, oldPin, newPin) {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found.");

    const match = await bcrypt.compare(oldPin, user.pin);
    if (!match) throw new Error("PIN ya zamani sio sahihi.");

    const hashed = await bcrypt.hash(newPin, 10);
    user.pin = hashed;
    await user.save();

    return { message: "PIN imebadilishwa kwa mafanikio." };
  }

  /**
   * ======================================================
   * 5️⃣ Delete User
   * ======================================================
   */
  async deleteUser(userId) {
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) throw new Error("User not found.");

    return { message: "User deleted successfully." };
  }

  /**
   * ======================================================
   * 6️⃣ Generate JWT Token for Login
   * ======================================================
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user._id,
        systemId: user.systemId,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  /**
   * ======================================================
   * 7️⃣ List All Users
   * ======================================================
   */
  async listUsers(role = null) {
    const filter = role ? { role } : {};
    return await User.find(filter).select("-pin");
  }

  /**
   * ======================================================
   * 8️⃣ Save Expo Push Token
   * ======================================================
   */
  async savePushToken(userId, token) {
    const user = await User.findByIdAndUpdate(
      userId,
      { expoPushToken: token },
      { new: true }
    );

    if (!user) throw new Error("User not found.");
    return user;
  }
}

module.exports = new UserService();
