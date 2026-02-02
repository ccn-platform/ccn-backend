 // utils/generateReference.js

module.exports = {
  randomCode(length = 10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  controlNumber() {
    return "CN-" + this.randomCode(12);
  },

  loanReference() {
    return "LN-" + this.randomCode(10);
  },

  transactionId() {
    return "TX-" + this.randomCode(15);
  }
};
