 // controllers/userController.js

const userService = require("../services/userService");
const normalizePhone = require("../utils/normalizePhone"); // ⭐ ADDED

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

      const updated = await userService.updateUser(req.params.id, req.body);
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
   * 7️⃣ SAVE EXPO PUSH TOKEN
   * ✅ ADD ONLY — supports BOTH token & expoPushToken
   */
  async savePushToken(req, res) {
    try {
      // 🔑 ACCEPT BOTH (SAFE ADDITION)
      const token = req.body.token || req.body.expoPushToken;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Push token is required.",
        });
      }

      const updatedUser = await userService.savePushToken(
        req.params.id,
        token
      );

      res.json({
        success: true,
        message: "Push token saved successfully.",
        user: updatedUser,
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new UserController();
