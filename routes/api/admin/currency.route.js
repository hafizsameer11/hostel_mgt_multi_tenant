/**
 * Currency Routes
 */

const express = require("express");
const router = express.Router();
const { authenticate, authorizeAdminOrOwner } = require("../../../middleware/auth.middleware");
const currencyController = require("../../../controllers/api/currency.controller");

/**
 * Get user's currency
 * GET /api/admin/currency
 * Access: Admin and Owner (Owner sees their own currency)
 */
router.get("/currency", authenticate, authorizeAdminOrOwner(), currencyController.getUserCurrency);

/**
 * Create or update user's currency (one per user)
 * POST /api/admin/currency
 * Body: { symbol, code?, name? }
 * Access: Admin and Owner (Owner can manage their own currency)
 */
router.post(
  "/currency",
  authenticate,
  authorizeAdminOrOwner(),
  currencyController.createOrUpdateCurrency
);

/**
 * Delete user's currency
 * DELETE /api/admin/currency
 * Access: Admin and Owner (Owner can delete their own currency)
 */
router.delete("/currency", authenticate, authorizeAdminOrOwner(), currencyController.deleteCurrency);

module.exports = router;
