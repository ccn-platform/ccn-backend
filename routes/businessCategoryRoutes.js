 const express = require("express");
const router = express.Router();

const businessCategoryController = require("../controllers/businessCategoryController");

// Middlewares
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const rateLimiter = require("../middleware/rateLimiter");
const requestLogger = require("../middleware/requestLogger");

// GLOBAL MIDDLEWARES
router.use(requestLogger);
router.use(rateLimiter);

/** CREATE - ADMIN ONLY */
router.post("/", auth, role("admin"), businessCategoryController.create);

/** 
 * LIST — PUBLIC (⭐ IMPORTANT)
 * Hii ndiyo inaruhusu Agent Registration kupata categories bila token.
 */
router.get("/", businessCategoryController.list);

/** UPDATE - ADMIN ONLY */
router.put("/:id", auth, role("admin"), businessCategoryController.update);

/** DELETE - ADMIN ONLY */
router.delete("/:id", auth, role("admin"), businessCategoryController.delete);

/* ============================================================
   ⭐ NEW ROUTES — Safe additions
============================================================ */

/** GET ONE CATEGORY - Requires login */
router.get("/:id/view", auth, businessCategoryController.getOne);

/** SEARCH CATEGORIES - Requires login */
router.get("/search/query", auth, businessCategoryController.search);

/** COUNT ALL - ADMIN ONLY */
router.get("/count/all", auth, role("admin"), businessCategoryController.count);

module.exports = router;
