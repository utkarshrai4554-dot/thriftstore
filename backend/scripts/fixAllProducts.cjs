const { admin } = require('../config/firebase');

// Fix all products: add missing status field and handle existing products
async function fixAllProducts() {
  try {
    console.log('🔧 Fixing all products in the database...');
    
    // Get all products from the products collection
    const productsRef = admin.firestore().collection('products');
    const snapshot = await productsRef.get();
    
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let fixedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      let needsUpdate = false;
      let updateData = {};
      
      // Check if status field is missing
      if (!data.status) {
        // For existing products without status, set as 'approved' so they appear in shop
        // You can change this logic to 'pending' if you want admin to review all
        updateData.status = 'approved';
        needsUpdate = true;
        console.log(`📝 Product ${doc.id} - Adding status: approved`);
      }
      
      // Add missing fields that the system expects
      if (!data.views) {
        updateData.views = 0;
        needsUpdate = true;
      }
      
      if (!data.likes) {
        updateData.likes = 0;
        needsUpdate = true;
      }
      
      // Add sellerId if missing (use userId if available)
      if (!data.sellerId && data.userId) {
        updateData.sellerId = data.userId;
        needsUpdate = true;
      }
      
      // Add updatedAt if missing
      if (!data.updatedAt) {
        updateData.updatedAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await productsRef.doc(doc.id).update(updateData);
        fixedCount++;
        
        // Count by status
        const status = updateData.status || data.status;
        if (status === 'pending') pendingCount++;
        else if (status === 'approved') approvedCount++;
        else if (status === 'rejected') rejectedCount++;
      } else {
        // Count existing products by status
        const status = data.status;
        if (status === 'pending') pendingCount++;
        else if (status === 'approved') approvedCount++;
        else if (status === 'rejected') rejectedCount++;
        
        console.log(`✅ Product ${doc.id} already has all required fields - Status: ${status}`);
      }
    }
    
    console.log(`\n🎉 Fix complete!`);
    console.log(`📊 Products fixed: ${fixedCount}`);
    console.log(`📊 Total products: ${snapshot.size}`);
    console.log(`📋 Pending products: ${pendingCount}`);
    console.log(`✅ Approved products: ${approvedCount}`);
    console.log(`❌ Rejected products: ${rejectedCount}`);
    console.log(`\n🌐 Admin Dashboard: http://localhost:8081/admin`);
    console.log(`🛍️ Shop Page: http://localhost:8081/products`);
    
  } catch (error) {
    console.error('❌ Error fixing products:', error);
  }
}

// Run the fix
fixAllProducts().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fix failed:', error);
  process.exit(1);
});
