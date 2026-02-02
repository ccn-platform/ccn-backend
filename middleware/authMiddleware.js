 const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Agent = require("../models/Agent");

module.exports = async (req, res, next) => {
  try {
    // --------------------------------------
    // 1️⃣ GET TOKEN
    // --------------------------------------
    const authHeader = req.header("Authorization");
 
    let token =
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.replace("Bearer ", "")
        : null) ||
      req.query.token ||
      req.body.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // --------------------------------------
    // 2️⃣ VERIFY TOKEN
    // --------------------------------------
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.userId || decoded.id;
    const role = decoded.role;
    const systemId = decoded.systemId;

    if (!userId || !role) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // --------------------------------------
    // 3️⃣ SET BASIC USER INFO
    // --------------------------------------
    req.user = {
      userId,
      role,
      systemId,
    };

    // --------------------------------------
    // 🆕 4️⃣ AUTO-RESOLVE AGENT ID (VERY IMPORTANT)
    // --------------------------------------
    if (role === "agent") {
      const agent = await Agent.findOne({ user: userId }).select("_id");

      if (!agent) {
        return res.status(403).json({
          success: false,
          message: "Agent profile haijapatikana",
        });
      }

      req.user.agentId = agent._id;
    }

    next();
  } catch (error) {
    console.error("Auth Error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }
};
