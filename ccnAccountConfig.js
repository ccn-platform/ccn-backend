 /**
 * ======================================================
 * CCN COMPANY ACCOUNT CONFIG
 * ======================================================
 * - Hapa ndipo kampuni (CCN) inapokea:
 *   - fees
 *   - penalties
 *   - subscription
 *   - rounding differences
 *
 * ⚠️ HII SIYO AGENT
 * ⚠️ HII SIYO CUSTOMER
 * ======================================================
 */

module.exports = {
  companyName: "CCN LTD",

  payoutAccount: {
    type: "MOBILE_MONEY", // or BANK
    provider: "AZAMPAY",  // M-Pesa / Tigo / Airtel / Bank
    accountNumber: "255700000000",
    accountName: "CCN LTD",
  },

  roles: {
    receivesFees: true,
    receivesPenalties: true,
    receivesSubscriptions: true,
    receivesRoundingRemainders: true,
  },
};
