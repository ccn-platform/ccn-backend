 // middleware/ipBlocker.js
const blockedIPs = new Set();

module.exports = function (req, res, next) {
  const ip = req.ip;

  if (blockedIPs.has(ip)) {
    return res.status(403).json({ message: "Your IP is blocked." });
  }

  next();
};

// Utility to block an IP
module.exports.blockIP = function (ip) {
  blockedIPs.add(ip);
};
