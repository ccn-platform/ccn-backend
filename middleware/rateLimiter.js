const rateLimit = require("express-rate-limit");

// DEFAULT API LIMIT
const defaultLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please try again later.",
});

// LOGIN LIMIT (strict)
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Try again later.",
});

// BIOMETRIC LIMIT
const biometricLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many biometric attempts. Please try again later.",
});

function rateLimiter(req, res, next) {
  return defaultLimiter(req, res, next);
}

rateLimiter.default = defaultLimiter;
rateLimiter.login = loginLimiter;
rateLimiter.biometric = biometricLimiter;

module.exports = rateLimiter;
