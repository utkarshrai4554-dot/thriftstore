const productService = require('../services/productService');
const { db } = require('../config/firebase.cjs');

class ProductController {
  // Create a new product
  async createProduct(req, res) {
    try {
      const productData = req.body;
      
      // Validate required fields
      const requiredFields = ['title', 'brand', 'category', 'sellingPrice', 'description', 'sellerId'];
      const missingFields = requiredFields.filter(field => !productData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Missing required fields',
          missingFields,
          code: 'MISSING_FIELDS'
        });
      }

      // Validate data types
      if (typeof productData.sellingPrice !== 'number' || productData.sellingPrice <= 0) {
        return res.status(400).json({
          error: 'Invalid selling price',
          code: 'INVALID_PRICE'
        });
      }

      if (productData.originalPrice && (typeof productData.originalPrice !== 'number' || productData.originalPrice < 0)) {
        return res.status(400).json({
          error: 'Invalid original price',
          code: 'INVALID_ORIGINAL_PRICE'
        });
      }

      // Create product
      const product = await productService.createProduct(productData);
      
      res.status(201).json({
        message: 'Product created successfully',
        product,
        code: 'PRODUCT_CREATED'
      });

    } catch (error) {
      console.error('Create Product Error:', error);
      res.status(500).json({
        error: 'Failed to create product',
        code: 'CREATE_ERROR',
        message: error.message
      });
    }
  }

  // Get product by ID
  async getProductById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          error: 'Product ID is required',
          code: 'MISSING_ID'
        });
      }

      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Only return approved products for public access
      if (product.status !== 'approved') {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      res.json({
        product,
        code: 'PRODUCT_FOUND'
      });

    } catch (error) {
      console.error('Get Product Error:', error);
      res.status(500).json({
        error: 'Failed to get product',
        code: 'GET_ERROR',
        message: error.message
      });
    }
  }

  // Get products by seller
  async getSellerProducts(req, res) {
    try {
      const { sellerId } = req.params;
      
      if (!sellerId) {
        return res.status(400).json({
          error: 'Seller ID is required',
          code: 'MISSING_SELLER_ID'
        });
      }

      const products = await productService.getSellerProducts(sellerId);
      
      res.json({
        products,
        count: products.length,
        code: 'SELLER_PRODUCTS_FOUND'
      });

    } catch (error) {
      console.error('Get Seller Products Error:', error);
      res.status(500).json({
        error: 'Failed to get seller products',
        code: 'GET_SELLER_ERROR',
        message: error.message
      });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      if (!id) {
        return res.status(400).json({
          error: 'Product ID is required',
          code: 'MISSING_ID'
        });
      }

      // Check if product exists
      const existingProduct = await productService.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Check permissions
      // Seller can only update if status is pending
      // Admin can update anytime (check req.user.role)
      if (existingProduct.status !== 'pending' && (!req.user || req.user.role !== 'admin')) {
        return res.status(403).json({
          error: 'Cannot update approved product',
          code: 'UPDATE_NOT_ALLOWED'
        });
      }

      const updatedProduct = await productService.updateProduct(id, updateData);
      
      res.json({
        message: 'Product updated successfully',
        product: updatedProduct,
        code: 'PRODUCT_UPDATED'
      });

    } catch (error) {
      console.error('Update Product Error:', error);
      res.status(500).json({
        error: 'Failed to update product',
        code: 'UPDATE_ERROR',
        message: error.message
      });
    }
  }

  // Delete product
  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          error: 'Product ID is required',
          code: 'MISSING_ID'
        });
      }

      // Check if product exists
      const existingProduct = await productService.getProductById(id);
      if (!existingProduct) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Check permissions
      // Seller can only delete if status is pending
      // Admin can delete anytime
      if (existingProduct.status !== 'pending' && (!req.user || req.user.role !== 'admin')) {
        return res.status(403).json({
          error: 'Cannot delete approved product',
          code: 'DELETE_NOT_ALLOWED'
        });
      }

      await productService.deleteProduct(id);
      
      res.json({
        message: 'Product deleted successfully',
        code: 'PRODUCT_DELETED'
      });

    } catch (error) {
      console.error('Delete Product Error:', error);
      res.status(500).json({
        error: 'Failed to delete product',
        code: 'DELETE_ERROR',
        message: error.message
      });
    }
  }

  // Get all approved products (public listing)
  async getApprovedProducts(req, res) {
    try {
      const { page = 1, limit = 20, category, minPrice, maxPrice, sortBy = 'createdAt' } = req.query;
      
      const filters = {
        status: 'approved',
        category: category || null,
        minPrice: minPrice ? parseFloat(minPrice) : null,
        maxPrice: maxPrice ? parseFloat(maxPrice) : null,
        sortBy,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await productService.getApprovedProducts(filters);
      
      res.json({
        products: result.products,
        pagination: result.pagination,
        filters,
        code: 'PRODUCTS_FOUND'
      });

    } catch (error) {
      console.error('Get Approved Products Error:', error);
      res.status(500).json({
        error: 'Failed to get products',
        code: 'GET_PRODUCTS_ERROR',
        message: error.message
      });
    }
  }

  // Update product status (admin only)
  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!id) {
        return res.status(400).json({
          error: 'Product ID is required',
          code: 'MISSING_ID'
        });
      }

      const validStatuses = ['pending', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          validStatuses,
          code: 'INVALID_STATUS'
        });
      }

      // Check admin permissions
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Admin access required',
          code: 'ADMIN_REQUIRED'
        });
      }

      const updatedProduct = await productService.updateProductStatus(id, status);
      
      res.json({
        message: `Product status updated to ${status}`,
        product: updatedProduct,
        code: 'STATUS_UPDATED'
      });

    } catch (error) {
      console.error('Update Status Error:', error);
      res.status(500).json({
        error: 'Failed to update product status',
        code: 'STATUS_UPDATE_ERROR',
        message: error.message
      });
    }
  }
}

module.exports = new ProductController();
