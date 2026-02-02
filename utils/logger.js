 // utils/logger.js

module.exports = {
  info(message, data = null) {
    console.log("ℹ️ INFO:", message, data || "");
  },

  success(message, data = null) {
    console.log("✔ SUCCESS:", message, data || "");
  },

  warn(message, data = null) {
    console.warn("⚠️ WARNING:", message, data || "");
  },

  error(message, data = null) {
    console.error("❌ ERROR:", message, data || "");
  }
};
