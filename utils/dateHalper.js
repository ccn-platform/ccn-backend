 // utils/dateHelper.js

module.exports = {
  
  // Rudisha tarehe ya leo
  now() {
    return new Date();
  },

  // Hesabu tofauti ya siku kati ya tarehe mbili
  daysBetween(d1, d2) {
    const diff = Math.abs(new Date(d1) - new Date(d2));
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  // Hesabu tofauti ya masaa kati ya tarehe mbili
  hoursBetween(d1, d2) {
    const diff = Math.abs(new Date(d1) - new Date(d2));
    return diff / (1000 * 60 * 60);
  },

  // Cheki kama tarehe ime-expire
  isExpired(date) {
    return new Date(date) < new Date();
  },

  // Ongeza siku kwenye tarehe
  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
};
