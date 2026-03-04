const { admin } = require('../config/firebase');

// Set specific products as approved for testing
async function setApprovedProducts() {
  try {
    console.log('✅ Setting up approved products for testing...');
    
    // Get all products
    const productsRef = admin.firestore().collection('products');
    const snapshot = await productsRef.get();
    
    let approvedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Set first few products as approved for testing
      if (approvedCount < 3) {
        await productsRef.doc(doc.id).update({
          status: 'approved',
          views: data.views || 0,
          likes: data.likes || 0,
          sellerId: data.sellerId || data.userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Approved product: ${data.title || data.name || doc.id}`);
        approvedCount++;
      } else {
        // Set remaining as pending for admin review
        await productsRef.doc(doc.id).update({
          status: 'pending',
          views: data.views || 0,
          likes: data.likes || 0,
          sellerId: data.sellerId || data.userId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`⏳ Set as pending: ${data.title || data.name || doc.id}`);
      }
    }
    
    console.log(`\n🎉 Setup complete!`);
    console.log(`✅ Approved products: ${approvedCount} (will appear in shop)`);
    console.log(`⏳ Pending products: ${snapshot.size - approvedCount} (will appear in admin)`);
    console.log(`\n🌐 Admin Dashboard: http://localhost:8081/admin`);
    console.log(`🛍️ Shop Page: http://localhost:8081/products`);
    
  } catch (error) {
    console.error('❌ Error setting up products:', error);
  }
}

// Run the setup
setApprovedProducts().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
