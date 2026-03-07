const crypto = require("crypto");

function randomCode(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }

  return code;
}

function controlNumber() {
  return "CN-" + randomCode(12);
}

function loanReference() {
  return "LN-" + randomCode(10);
}

function transactionId() {
  const time = Date.now().toString(36).toUpperCase();
  return `TX-${time}-${randomCode(8)}`;
}

module.exports = {
  randomCode,
  controlNumber,
  loanReference,
  transactionId
}; 
