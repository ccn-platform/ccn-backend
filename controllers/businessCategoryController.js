 const businessCategoryService = require("../services/businessCategoryService");

class BusinessCategoryController {

  /** CREATE CATEGORY */
  async create(req, res) {
    try {
      const { name, description } = req.body;
      const category = await businessCategoryService.createCategory(name, description);
      res.status(201).json(category);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** LIST ALL */
  async list(req, res) {
    try {
      const categories = await businessCategoryService.getAllCategories();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  /** UPDATE */
  async update(req, res) {
    try {
      const updated = await businessCategoryService.updateCategory(
        req.params.id,
        req.body
      );
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** DELETE */
  async delete(req, res) {
    try {
      await businessCategoryService.deleteCategory(req.params.id);
      res.json({ message: "Category deleted successfully." });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** ⭐ NEW — GET ONE CATEGORY */
  async getOne(req, res) {
    try {
      const category = await businessCategoryService.getCategoryById(req.params.id);
      if (!category) return res.status(404).json({ message: "Category not found" });
      res.json(category);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** ⭐ NEW — SEARCH CATEGORIES */
  async search(req, res) {
    try {
      const { q } = req.query;
      const results = await businessCategoryService.searchCategories(q || "");
      res.json(results);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  /** ⭐ NEW — CATEGORY COUNT */
  async count(req, res) {
    try {
      const total = await businessCategoryService.countCategories();
      res.json({ total });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
}

module.exports = new BusinessCategoryController();
