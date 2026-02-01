 // config/passwordPolicy.js

module.exports = {
  MIN_PIN_LENGTH: 4,
  MAX_PIN_LENGTH: 6,

  validatePin(pin) {
    if (!pin) return false;
    if (String(pin).length < this.MIN_PIN_LENGTH) return false;
    if (String(pin).length > this.MAX_PIN_LENGTH) return false;
    return true;
  },

  validateStrongPassword(password) {
    // Optional for Admin App
    const regex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  },
};
