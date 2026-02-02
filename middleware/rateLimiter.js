 const rateLimit = require("express-rate-limit");

const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later.",
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later.",
});

const biometricLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: "Too many biometric attempts. Please try again later.",
});

function rateLimiter(req, res, next) {
  return defaultLimiter(req, res, next);
}

rateLimiter.default = defaultLimiter;
rateLimiter.login = loginLimiter;
rateLimiter.biometric = biometricLimiter;

module.exports = rateLimiter;
