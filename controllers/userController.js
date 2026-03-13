  // controllers/userController.js

const userService = require("../services/userService");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ ADDED
const Loan = require("../models/Loan");
 const Agent = require("../models/Agent");

class UserController {
  /**
   * 1️⃣ CREATE USER (Admin Only)
   */
  async create(req, res) {
    try {
      if (req.body.phone) {
        req.body.phone = normalizePhone(req.body.phone);
      }

      const user = await userService.createUser(req.body);
      res.status(201).json({ success: true, user });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 2️⃣ GET ONE USER
   */
  async getOne(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
 
  /**
 * 3️⃣ UPDATE USER (Profile Edit)
 */
async update(req, res) {
  try {
    if (req.body.phone) {
      req.body.phone = normalizePhone(req.body.phone);
    }

   const userId = req.params.id;

// 🔐 customer asibadilishe mwingine
if (
  req.user.role === "customer" &&
  String(req.user.userId) !== String(userId)
) {
  return res.status(403).json({
    success: false,
    message: "Unauthorized",
  });
}


    // ============================
    // GET USER
    // ============================
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ============================
    // 🔴 CUSTOMER RULE
    // ============================
    if (user.role === "customer") {
      const hasDebt = await Loan.findOne({
        customer: user._id,
        status: { $in: ["active", "overdue"] },
      });

      if (hasDebt) {
        return res.status(400).json({
          success: false,
          message:
            "Una deni linaloendelea. Maliza kwanza ndipo uedit profile.",
        });
      }
    }

    // ============================
    // UPDATE
    // ============================
    const updated = await userService.updateUser(userId, req.body);
    // ⭐ SYNC AGENT PROFILE
 if (updated.role === "agent") {
  const Agent = require("../models/Agent");

  await Agent.findOneAndUpdate(
    { user: updated._id },
    {
      fullName: updated.fullName,
      phone: updated.phone,
      businessName: updated.businessName,
    },
    { new: true }
  );
}

    res.json({ success: true, user: updated });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

  /**
   * 4️⃣ CHANGE PIN (Customer Only)
   */
  async changePin(req, res) {
    try {
      const { oldPin, newPin } = req.body;

      if (!oldPin || !newPin) {
        return res.status(400).json({
          success: false,
          message: "oldPin and newPin are required.",
        });
      }

      const result = await userService.changePin(
        req.params.id,
        oldPin,
        newPin
      );

      res.json({
        success: true,
        message: "PIN updated successfully",
        result,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 5️⃣ DELETE USER
   */
  async delete(req, res) {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.json({ success: true, result });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * 6️⃣ LIST USERS (Admin Only)
   */
  async list(req, res) {
    try {
      const users = await userService.listUsers(req.query.role);
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

 
/**
 * 8️⃣ REQUEST ACCOUNT DELETE
 */
async requestDeleteAccount(req, res) {
  try {
    const userId = req.user.userId;
    const role = req.user.role;

    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // already requested
    if (user.deleteRequested) {
      return res.status(400).json({
        success: false,
        message: "Tayari umeomba kufuta akaunti. Tafadhali subiri mchakato ukamilike.",
      });
    }

    // ===============================
    // CUSTOMER: lazima asiwe na deni
    // ===============================
    if (role === "customer") {
      const hasDebt = await Loan.findOne({
        customer: user._id,
        status: { $in: ["active", "overdue"] },
      });

      if (hasDebt) {
        return res.status(400).json({
          success: false,
          message:
            "Huwezi kufuta account ukiwa na deni. Tafadhali maliza deni kwanza.",
        });
      }
    }

    // ===============================
// AGENT: lazima asiwe na madeni aliyokopesha
// ===============================
if (role === "agent") {

  const agent = await Agent.findOne({ user: user._id });

  if (!agent) {
    return res.status(400).json({
      success: false,
      message: "Agent account not found.",
    });
  }

  const activeLoans = await Loan.exists({
      agent: agent._id,
      status: { $in: ["active", "overdue", "pending_agent_review"] },
   });

  if (activeLoans) {
    return res.status(400).json({
      success: false,
     message:
      "Huwezi kufuta account yako kwa sababu bado kuna mikopo ya wateja haijalipwa. Tafadhali hakikisha madeni yote yamelipwa kwanza."
    });
  }
}
    // ===============================
    // SAVE REQUEST
    // ===============================
    user.deleteRequested = true;
    user.deleteRequestedAt = new Date();
    await user.save();

    return res.json({
      success: true,
      message:
       "Tumepokea ombi lako la kufuta akaunti. Akaunti yako itafutwa ndani ya saa 48 baada ya kuthibitishwa kuwa hakuna deni linaloendelea.",
     });

  } catch (err) {
    console.error("DELETE REQUEST ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to request account deletion",
    });
  }
}

 
}

module.exports = new UserController();
