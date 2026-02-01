 // config/security.js
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");

module.exports = (app) => {
  // Secure HTTP headers
  app.use(helmet());

  // Prevent NoSQL injection
  app.use(mongoSanitize());

  // Prevent XSS attacks
  app.use(xssClean());

  // Prevent sensitive headers exposure
  app.disable("x-powered-by");

  console.log("🔐 Security middleware activated");
};
