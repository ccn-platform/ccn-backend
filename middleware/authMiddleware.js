  const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Agent = require("../models/Agent");

module.exports = async (req, res, next) => {
  try {
    // --------------------------------------
    // 1️⃣ GET TOKEN
    // --------------------------------------
     const authHeader = req.header("Authorization");

if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
}

const token = authHeader.replace("Bearer ", "");

    
    
    // --------------------------------------
    // 2️⃣ VERIFY TOKEN
    // --------------------------------------
    const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;

if (!JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET not defined");
}

const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

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
