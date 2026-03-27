const { admin } = require('../config/firebase');

// Update specific product status
async function updateProductStatus(productId, status) {
  try {
    console.log(`🔄 Updating product ${productId} to status: ${status}`);
    
    // Update the product
    await admin.firestore().collection('products').doc(productId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully updated product ${productId}`);
    console.log(`🌐 Check admin dashboard: http://localhost:8081/admin`);
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const productId = args[0];
const status = args[1];

if (!productId || !status) {
  console.log('Usage: node updateSpecificProduct.js <productId> <status>');
  console.log('Example: node updateSpecificProduct.js 1772428747337_mWbo6... pending');
  console.log('Available statuses: pending, approved, rejected');
  process.exit(1);
}

if (!['pending', 'approved', 'rejected'].includes(status)) {
  console.log('❌ Invalid status. Available statuses: pending, approved, rejected');
  process.exit(1);
}

// Run the update
updateProductStatus(productId, status).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Update failed:', error);
  process.exit(1);
});
