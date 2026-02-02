 // utils/validators.js

module.exports = {

  isEmail(email) {
    return /\S+@\S+\.\S+/.test(email);
  },

  isPhone(phone) {
    return /^[0-9]{10,13}$/.test(phone);
  },

  isNumeric(value) {
    return !isNaN(value);
  },

  requiredFields(obj, fields = []) {
    const missing = [];

    fields.forEach(field => {
      if (!obj[field] && obj[field] !== 0) {
        missing.push(field);
      }
    });

    return missing.length ? missing : null;
  }
};
