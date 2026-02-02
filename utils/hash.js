const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const SALT_ROUNDS = 12;

module.exports = {
  /**
   * 🔐 Hash password (for login credentials)
   */
  async hashPassword(password) {
    if (!password) throw new Error("Password is required");
    return await bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * 🔍 Compare plain password with hashed one
   */
  async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * 🔒 Create deterministic hash (for face, tokens, etc.)
   */
  hashData(data) {
    if (!data) throw new Error("Data required for hashing");

    return crypto
      .createHash("sha256")
      .update(String(data))
      .digest("hex");
  },
};
