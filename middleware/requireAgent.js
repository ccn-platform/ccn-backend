 const Agent = require("../models/Agent");

module.exports = async function requireAgent(req, res, next) {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let agent = await Agent.findOne({ user: req.user._id });

    if (!agent && req.user.role === "agent") {
      agent = await Agent.create({
        user: req.user._id,
        fullName: req.user.fullName || "Agent",
        phone: req.user.phone || null,
        status: "active",
      });
    }

    if (!agent) {
      return res.status(403).json({
        success: false,
        message: "Account hii haina agent profile",
      });
    }

    req.user.agentId = agent._id;
    next();
  } catch (err) {
    next(err);
  }
};
