// routes/ussdRoutes.js

const express = require("express");
const router = express.Router();

const ussdController = require("../controllers/ussdController");

/**
 * ======================================================
 * USSD ROUTE — CCN (*212*88#)
 * ======================================================
 *
 * POST /api/ussd
 */
router.post("/", ussdController.handleUssd);

module.exports = router;
