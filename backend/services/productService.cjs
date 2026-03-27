const { db } = require('../config/firebase.cjs');

class ProductService {
  // Create a new product
  async createProduct(productData) {
    try {
      const product = {
        title: productData.title,
        brand: productData.brand,
        category: productData.category,
        color: productData.color || null,
        size: productData.size || null,
        condition: productData.condition || 'Good',
        originalPrice: productData.originalPrice || null,
        sellingPrice: productData.sellingPrice,
        description: productData.description,
        images: productData.images || [],
        sellerId: productData.sellerId,
        status: 'pending', // Default status for admin approval
        views: 0,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await db.collection('products').add(product);
      
      return {
        id: docRef.id,
        ...product
      };

    } catch (error) {
      console.error('Create Product Service Error:', error);
      throw error;
    }
  }

  // Get product by ID
  async getProductById(id) {
    try {
      const doc = await db.collection('products').doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      };

    } catch (error) {
      console.error('Get Product Service Error:', error);
      throw error;
    }
  }

  // Get products by seller ID
  async getSellerProducts(sellerId) {
    try {
      const snapshot = await db.collection('products')
        .where('sellerId', '==', sellerId)
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

    } catch (error) {
      console.error('Get Seller Products Service Error:', error);
      throw error;
    }
  }

  // Update product
  async updateProduct(id, updateData) {
    try {
      const productRef = db.collection('products').doc(id);
      
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };

      await productRef.update(updateFields);
      
      // Return updated product
      return await this.getProductById(id);

    } catch (error) {
      console.error('Update Product Service Error:', error);
      throw error;
    }
  }

  // Delete product
  async deleteProduct(id) {
    try {
      await db.collection('products').doc(id).delete();
      return true;

    } catch (error) {
      console.error('Delete Product Service Error:', error);
      throw error;
    }
  }

  // Get approved products with filters and pagination
  async getApprovedProducts(filters = {}) {
    try {
      let query = db.collection('products')
        .where('status', '==', 'approved');

      // Apply filters
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.minPrice !== null) {
        query = query.where('sellingPrice', '>=', filters.minPrice);
      }

      if (filters.maxPrice !== null) {
        query = query.where('sellingPrice', '<=', filters.maxPrice);
      }

      // Sorting
      const sortField = filters.sortBy || 'createdAt';
      const sortDirection = sortField === 'sellingPrice' ? 'asc' : 'desc';
      query = query.orderBy(sortField, sortDirection);

      // Pagination
      const limit = filters.limit || 20;
      const page = filters.page || 1;
      const offset = (page - 1) * limit;

      const snapshot = await query.limit(limit).offset(offset).get();

      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

      // Get total count for pagination
      const countSnapshot = await db.collection('products')
        .where('status', '==', 'approved')
        .get();
      
      const totalCount = countSnapshot.size;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };

    } catch (error) {
      console.error('Get Approved Products Service Error:', error);
      throw error;
    }
  }

  // Update product status
  async updateProductStatus(id, status) {
    try {
      return await this.updateProduct(id, { status });

    } catch (error) {
      console.error('Update Product Status Service Error:', error);
      throw error;
    }
  }

  // Increment product views
  async incrementViews(id) {
    try {
      const productRef = db.collection('products').doc(id);
      await productRef.update({
        views: db.FieldValue.increment(1)
      });

    } catch (error) {
      console.error('Increment Views Service Error:', error);
      throw error;
    }
  }

  // Toggle product like
  async toggleLike(id, userId) {
    try {
      const productRef = db.collection('products').doc(id);
      const product = await this.getProductById(id);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // This would need a separate likes collection for proper implementation
      // For now, just increment/decrement the likes count
      const likesRef = productRef.collection('likes').doc(userId);
      const likeDoc = await likesRef.get();

      if (likeDoc.exists) {
        // Remove like
        await likesRef.delete();
        await productRef.update({
          likes: db.FieldValue.increment(-1)
        });
        return { liked: false, likes: product.likes - 1 };
      } else {
        // Add like
        await likesRef.set({
          userId,
          createdAt: new Date()
        });
        await productRef.update({
          likes: db.FieldValue.increment(1)
        });
        return { liked: true, likes: product.likes + 1 };
      }

    } catch (error) {
      console.error('Toggle Like Service Error:', error);
      throw error;
    }
  }

  // Search products
  async searchProducts(searchTerm, filters = {}) {
    try {
      // This is a basic implementation
      // For production, consider using Algolia or Elasticsearch for better search
      
      let query = db.collection('products')
        .where('status', '==', 'approved');

      // For now, we'll do a simple text search on title and description
      // In production, you'd want to use a proper search service
      if (searchTerm) {
        // This is a simplified approach - in production, use proper search indexing
        query = query.where('title', '>=', searchTerm)
          .where('title', '<=', searchTerm + '\uf8ff');
      }

      // Apply other filters
      if (filters.category) {
        query = query.where('category', '==', filters.category);
      }

      if (filters.minPrice !== null) {
        query = query.where('sellingPrice', '>=', filters.minPrice);
      }

      if (filters.maxPrice !== null) {
        query = query.where('sellingPrice', '<=', filters.maxPrice);
      }

      const snapshot = await query.limit(20).get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));

    } catch (error) {
      console.error('Search Products Service Error:', error);
      throw error;
    }
  }

  // ========================================
  // AI-READY FUNCTIONS (PLACEHOLDERS)
  // ========================================
  
  /**
   * TODO: Generate AI-powered product description
   * @param {Object} productData - Product information
   * @returns {Promise<string>} Generated description
   */
  async generateDescription(productData) {
    // Placeholder for AI description generation
    // Will integrate with OpenAI API later
    console.log('AI Description Generation - Not implemented yet');
    return productData.description || '';
  }

  /**
   * TODO: Suggest optimal selling price using AI
   * @param {Object} productData - Product information
   * @returns {Promise<number>} Suggested price
   */
  async suggestPrice(productData) {
    // Placeholder for AI price suggestion
    // Will integrate with OpenAI API later
    console.log('AI Price Suggestion - Not implemented yet');
    return productData.sellingPrice || 0;
  }

  /**
   * TODO: Detect product condition from images using AI
   * @param {Array} imageUrls - Array of image URLs
   * @returns {Promise<string>} Detected condition
   */
  async detectCondition(imageUrls) {
    // Placeholder for AI condition detection
    // Will integrate with computer vision API later
    console.log('AI Condition Detection - Not implemented yet');
    return 'Good';
  }

  /**
   * TODO: Generate smart tags for product
   * @param {Object} productData - Product information
   * @returns {Promise<Array>} Generated tags
   */
  async generateTags(productData) {
    // Placeholder for AI tag generation
    // Will integrate with OpenAI API later
    console.log('AI Tag Generation - Not implemented yet');
    return [];
  }

  /**
   * TODO: Get similar products recommendations
   * @param {string} productId - Product ID
   * @returns {Promise<Array>} Similar products
   */
  async getSimilarProducts(productId) {
    // Placeholder for AI-powered recommendations
    // Will implement collaborative filtering or content-based recommendations
    console.log('AI Similar Products - Not implemented yet');
    return [];
  }
}

module.exports = new ProductService();
