const { admin } = require('../config/firebase');

// Fix products that are missing status field
async function fixProductStatus() {
  try {
    console.log('🔧 Fixing products without status field...');
    
    // Get all products from the products collection
    const productsRef = admin.firestore().collection('products');
    const snapshot = await productsRef.get();
    
    let fixedCount = 0;
    let skippedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if status field is missing
      if (!data.status) {
        console.log(`📝 Updating product ${doc.id} - Adding status: pending`);
        
        // Add status field as 'pending'
        await productsRef.doc(doc.id).update({
          status: 'pending',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        fixedCount++;
      } else {
        console.log(`✅ Product ${doc.id} already has status: ${data.status}`);
        skippedCount++;
      }
    }
    
    console.log(`\n🎉 Fix complete!`);
    console.log(`📊 Products fixed: ${fixedCount}`);
    console.log(`📊 Products skipped: ${skippedCount}`);
    console.log(`🌐 Check admin dashboard: http://localhost:8081/admin`);
    
  } catch (error) {
    console.error('❌ Error fixing product status:', error);
  }
}

// Run the fix
fixProductStatus().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Fix failed:', error);
  process.exit(1);
});
