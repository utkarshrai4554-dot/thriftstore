const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const soldProductService = require('../services/soldProductService');
const rateLimit = require('express-rate-limit');

// Rate limiting for product operations
const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many product requests, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all product routes
router.use(productLimiter);

/**
 * POST /api/products
 * Create a new product
 * 
 * Request Body:
 * {
 *   "title": "Product Title",
 *   "brand": "Brand Name",
 *   "category": "shirts",
 *   "color": "black",
 *   "size": "M",
 *   "condition": "Good",
 *   "originalPrice": 999,
 *   "sellingPrice": 399,
 *   "description": "Product description",
 *   "images": ["image1.jpg", "image2.jpg"],
 *   "sellerId": "user123"
 * }
 */
router.post('/', auth.optional, productController.createProduct);

/**
 * GET /api/products/:id
 * Get a specific product by ID (public access)
 */
router.get('/:id', productController.getProductById);

/**
 * GET /api/products
 * Get all approved products with filters and pagination (public access)
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 * - category: Filter by category
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 * - sortBy: Sort field (createdAt, sellingPrice, likes, views)
 */
router.get('/', productController.getApprovedProducts);

/**
 * GET /api/products/search
 * Search products (public access)
 * 
 * Query Parameters:
 * - q: Search term
 * - category: Filter by category
 * - minPrice: Minimum price filter
 * - maxPrice: Maximum price filter
 */
router.get('/search', productController.getApprovedProducts);

/**
 * GET /api/products/seller/:sellerId
 * Get all products by a specific seller
 */
router.get('/seller/:sellerId', productController.getSellerProducts);

/**
 * PUT /api/products/:id
 * Update a product
 * Requires authentication
 * Seller can update only if status is pending
 * Admin can update anytime
 */
router.put('/:id', auth.required, productController.updateProduct);

/**
 * DELETE /api/products/:id
 * Delete a product
 * Requires authentication
 * Seller can delete only if status is pending
 * Admin can delete anytime
 */
router.delete('/:id', auth.required, productController.deleteProduct);

/**
 * PATCH /api/products/:id/status
 * Update product status (admin only)
 * 
 * Request Body:
 * {
 *   "status": "approved" | "rejected" | "pending"
 * }
 */
router.patch('/:id/status', auth.required, auth.requireAdmin, productController.updateProductStatus);

/**
 * POST /api/products/:id/views
 * Increment product view count
 */
router.post('/:id/views', productController.incrementViews);

/**
 * POST /api/products/:id/like
 * Toggle product like
 * Requires authentication
 */
router.post('/:id/like', auth.required, productController.toggleLike);

/**
 * GET /api/products/:id/similar
 * Get similar products (AI-powered - placeholder)
 */
router.get('/:id/similar', productController.getSimilarProducts);

// Mark product as sold and move to productsSold collection
router.post('/:id/mark-sold', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, buyerId } = req.body;
    
    if (!id || !quantity || !buyerId) {
      return res.status(400).json({
        error: 'Product ID, quantity, and buyer ID are required',
        code: 'MISSING_DATA'
      });
    }

    // Move product to sold collection with buyerId
    const result = await soldProductService.moveProductToSold(id, quantity, buyerId);
    
    res.json({
      message: 'Product marked as sold successfully',
      result,
      code: 'PRODUCT_SOLD'
    });

  } catch (error) {
    console.error('Mark Product Sold Error:', error);
    res.status(500).json({
      error: 'Failed to mark product as sold',
      code: 'MARK_SOLD_ERROR',
      message: error.message
    });
  }
});

module.exports = router;
