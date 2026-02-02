 /**
 * ======================================================
 * APP TYPE GUARD (CUSTOMER ONLY)
 * ======================================================
 * - Inazuia matumizi ya API kutoka app zisizo halali
 * - Inatumia header: x-app-type
 */

module.exports = function appTypeGuard(req, res, next) {
  const appType =
    (req.headers["x-app-type"] ||
      req.body?.appType ||
      req.query?.appType ||
      "").toLowerCase();

  if (appType !== "customer") {
    return res.status(403).json({
      success: false,
      error: "ACCESS_DENIED",
      message: "This endpoint is restricted to Customer application only",
    });
  }

  next();
};
