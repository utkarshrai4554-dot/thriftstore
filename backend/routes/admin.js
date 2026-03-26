const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

// Apply authentication to all admin routes
router.use(auth.required);

/**
 * GET /api/admin/pending
 * Get all pending products for admin review
 */
router.get('/pending', adminController.getPendingProducts);

/**
 * POST /api/admin/products/:id/approve
 * Approve a product and move to acceptedProducts
 */
router.post('/products/:id/approve', auth.requireAdmin, adminController.approveProduct);

/**
 * POST /api/admin/products/:id/reject
 * Reject a product and move to rejectedProducts
 */
router.post('/products/:id/reject', auth.requireAdmin, adminController.rejectProduct);

module.exports = router;
