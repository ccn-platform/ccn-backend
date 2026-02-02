 // backend/middleware/requireAuth.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Agent = require("../models/Agent");
const generateReference = require("../utils/generateReference");

module.exports = async function requireAuth(req, res, next) {
  try {
    let token =
      req.header("Authorization")?.replace("Bearer ", "") ||
      req.query.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token user",
      });
    }

    req.user = user;

    /**
     * ======================================================
     * ⭐ SINGLE SOURCE OF TRUTH FOR AGENT
     * ======================================================
     */
    if (user.role === "agent") {
      let agent = await Agent.findOne({ user: user._id });

      // 🆕 AUTO-CREATE (HAPA NDIPO ILIKUWA ZAMANI KIMANTIKI)
      if (!agent) {
        agent = await Agent.create({
          user: user._id,
          agentId: generateReference.agentId(),
          fullName: user.fullName || "Agent",
          phone: user.phone || null,
          status: "active",
          isVerified: false,
          subscriptionSnapshot: {
            status: "expired",
            expiresOn: null,
            plan: null,
          },
          payoutAccounts: [],
          primaryPayoutAccount: null,
        });
      }

      req.user.agentId = agent._id;
      req.user._agentCode = agent.agentId;
    }

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
