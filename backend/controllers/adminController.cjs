const productService = require('../services/productService');
const { admin } = require('../config/firebase.cjs');

class AdminController {
  // Get pending products for admin review
  async getPendingProducts(req, res) {
    try {
      const products = await productService.getPendingProducts();
      
      res.json({
        products,
        count: products.length,
        code: 'PENDING_PRODUCTS_FOUND'
      });

    } catch (error) {
      console.error('Get Pending Products Error:', error);
      res.status(500).json({
        error: 'Failed to get pending products',
        code: 'GET_PENDING_ERROR',
        message: error.message
      });
    }
  }

  // Approve product - move to acceptedProducts and delete from products
  async approveProduct(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          error: 'Product ID is required',
          code: 'MISSING_ID'
        });
      }

      // Get product from products collection
      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Move to acceptedProducts collection
      const approvedProduct = {
        ...product,
        status: 'approved',
        approvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await productService.addProductToAccepted(approvedProduct);
      
      // Delete from products collection
      await productService.deleteProduct(id);
      
      res.json({
        message: 'Product approved successfully',
        product: approvedProduct,
        code: 'PRODUCT_APPROVED'
      });

    } catch (error) {
      console.error('Approve Product Error:', error);
      res.status(500).json({
        error: 'Failed to approve product',
        code: 'APPROVE_ERROR',
        message: error.message
      });
    }
  }

  // Reject product - move to rejectedProducts and delete from products
  async rejectProduct(req, res) {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      
      if (!id) {
        return res.status(400).json({
          error: 'Product ID is required',
          code: 'MISSING_ID'
        });
      }

      // Get product from products collection
      const product = await productService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Product not found',
          code: 'PRODUCT_NOT_FOUND'
        });
      }

      // Move to rejectedProducts collection
      const rejectedProduct = {
        ...product,
        status: 'rejected',
        rejectionReason: rejectionReason || 'Admin rejected',
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await productService.addProductToRejected(rejectedProduct);
      
      // Delete from products collection
      await productService.deleteProduct(id);
      
      res.json({
        message: 'Product rejected successfully',
        product: rejectedProduct,
        code: 'PRODUCT_REJECTED'
      });

    } catch (error) {
      console.error('Reject Product Error:', error);
      res.status(500).json({
        error: 'Failed to reject product',
        code: 'REJECT_ERROR',
        message: error.message
      });
    }
  }
}

module.exports = new AdminController();
