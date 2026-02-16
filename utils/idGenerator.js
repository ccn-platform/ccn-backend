  /**
 * ===========================================
 *  ID GENERATOR HELPER
 *  - Customer IDs
 *  - Agent IDs
 *  - Loan IDs
 * ===========================================
 */

const generateRandom = (length = 10) => {
  let result = "";
  const chars = "0123456789";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * CUSTOMER ID
 * Example: CUST-839201
 */
function generateCustomerID() {
  return `CUST-${generateRandom(8)}`;
}

/**
 * AGENT ID
 * Example: AGT-193002
 */
function generateAgentID() {
  return `AGT-${generateRandom(7)}`;
}

/**
 * LOAN ID
 * Example: LOAN-552221
 */
function generateLoanID() {
  return `LOAN-${generateRandom(6)}`;
}

// ===============================
// EXPORT FUNCTIONS
// ===============================
module.exports = {
  generateCustomerID,
  generateAgentID,
  generateLoanID,
};
