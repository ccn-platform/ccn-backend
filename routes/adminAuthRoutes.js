 const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");

router.get("/me", adminAuth, (req, res) => {
  res.json({
    _id: req.admin.id,
    fullName: req.admin.fullName,
    email: "dev@admin.local",
  });
});

module.exports = router;
