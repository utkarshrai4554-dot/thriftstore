const { db } = require('../config/firebase.cjs');

class SoldProductService {
  // Move product from acceptedProducts to productsSold after purchase
  async moveProductToSold(productId, quantitySold = 1) {
    try {
      console.log(`🔄 Moving product ${productId} to sold products...`);
      
      // Get product from acceptedProducts
      const productRef = db.collection('acceptedProducts').doc(productId);
      const productDoc = await productRef.get();
      
      if (!productDoc.exists) {
        throw new Error('Product not found in acceptedProducts');
      }

      const productData = productDoc.data();
      
      // Create sold product record
      const soldProductData = {
        ...productData,
        originalProductId: productId,
        quantitySold: quantitySold,
        soldAt: new Date(),
        soldPrice: productData.sellingPrice,
        buyerId: null, // Will be set during checkout
        status: 'sold',
        movedToSoldAt: new Date()
      };

      // Add to productsSold collection
      await db.collection('productsSold').add(soldProductData);
      
      // Update product quantity in acceptedProducts
      const newQuantity = (productData.quantity || 1) - quantitySold;
      
      if (newQuantity <= 0) {
        // Remove from acceptedProducts if sold out
        await productRef.delete();
        console.log(`✅ Product ${productId} sold out and removed from acceptedProducts`);
      } else {
        // Update quantity
        await productRef.update({
          quantity: newQuantity,
          soldQuantity: (productData.soldQuantity || 0) + quantitySold,
          updatedAt: new Date()
        });
        console.log(`✅ Product ${productId} quantity updated to ${newQuantity}`);
      }

      return { success: true, newQuantity };

    } catch (error) {
      console.error('Move Product to Sold Error:', error);
      throw error;
    }
  }

  // Get all sold products
  async getSoldProducts() {
    try {
      const snapshot = await db.collection('productsSold')
        .orderBy('soldAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        soldAt: doc.data().soldAt?.toDate()
      }));

    } catch (error) {
      console.error('Get Sold Products Error:', error);
      throw error;
    }
  }

  // Get sold products by buyer
  async getSoldProductsByBuyer(buyerId) {
    try {
      const snapshot = await db.collection('productsSold')
        .where('buyerId', '==', buyerId)
        .orderBy('soldAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        soldAt: doc.data().soldAt?.toDate()
      }));

    } catch (error) {
      console.error('Get Sold Products by Buyer Error:', error);
      throw error;
    }
  }

  // Update sold product with buyer information
  async updateSoldProductWithBuyer(soldProductId, buyerId) {
    try {
      await db.collection('productsSold').doc(soldProductId).update({
        buyerId: buyerId,
        updatedAt: new Date()
      });

      return { success: true };

    } catch (error) {
      console.error('Update Sold Product Buyer Error:', error);
      throw error;
    }
  }
}

module.exports = new SoldProductService();
