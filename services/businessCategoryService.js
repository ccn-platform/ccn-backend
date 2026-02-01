 // backend/services/businessCategoryService.js
const BusinessCategory = require("../models/businessCategory");

class BusinessCategoryService {
  /**
   * ======================================================
   * 1️⃣ Create new business category
   * ======================================================
   */
  async createCategory(name, description) {
    const exists = await BusinessCategory.findOne({ name });

    if (exists) {
      throw new Error("Category imekwishasajiliwa.");
    }

    return await BusinessCategory.create({
      name,
      description: description || "",
    });
  }

  /**
   * ======================================================
   * 2️⃣ List all categories
   * ======================================================
   */
  async getAllCategories() {
    return await BusinessCategory.find().sort({ name: 1 });
  }

  /**
   * ======================================================
   * 3️⃣ Update category
   * ======================================================
   */
  async updateCategory(categoryId, updateData) {
    return await BusinessCategory.findByIdAndUpdate(
      categoryId,
      updateData,
      { new: true }
    );
  }

  /**
   * ======================================================
   * 4️⃣ Delete category
   * ======================================================
   */
  async deleteCategory(categoryId) {
    return await BusinessCategory.findByIdAndDelete(categoryId);
  }

  /* ======================================================
   * ⭐ 5️⃣ Extra utilities (Safe additions — no interference)
   * ====================================================== */

  // Get single category
  async getCategoryById(id) {
    return await BusinessCategory.findById(id);
  }

  // Check existence (useful kwa validation)
  async categoryExists(id) {
    const category = await BusinessCategory.findById(id);
    return !!category;
  }

  // Count categories — good for admin dashboard
  async countCategories() {
    return await BusinessCategory.countDocuments();
  }

  // Search categories (optional future feature)
  async searchCategories(query) {
    return await BusinessCategory.find({
      name: { $regex: query, $options: "i" }
    });
  }
}

module.exports = new BusinessCategoryService();
