 // middleware/requestLogger.js
module.exports = function (req, res, next) {
  console.log(
    `📥 ${req.method} ${req.originalUrl} - User: ${req.user?._id || "Guest"}`
  );
  next();
};
