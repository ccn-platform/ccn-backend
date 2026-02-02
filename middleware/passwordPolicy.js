 // middleware/passwordPolicy.js
module.exports = function (req, res, next) {
  const password = req.body.password;
  if (!password)
    return res.status(400).json({ message: "Password required" });

  const strong =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{6,}$/; // Customize if needed

  if (!strong.test(password)) {
    return res.status(400).json({
      message:
        "Password must contain uppercase, lowercase, number and be 6+ characters",
    });
  }

  next();
};
