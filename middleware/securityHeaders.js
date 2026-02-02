 // middleware/securityHeaders.js
module.exports = function (req, res, next) {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Content-Type-Options", "nosniff");

  next();
};
