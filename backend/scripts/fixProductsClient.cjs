// Simple script to fix products using client-side Firebase
// Run this in the browser console at http://localhost:8081

async function fixAllProducts() {
  console.log('🔧 Fixing all products...');
  
  try {
    // Import Firebase (already available in your app)
    const { collection, getDocs, doc, updateDoc, serverTimestamp } = firebase.firestore();
    
    // Get all products
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    let fixedCount = 0;
    let approvedCount = 0;
    let pendingCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      let needsUpdate = false;
      let updateData = {};
      
      // Check if status field is missing
      if (!data.status) {
        // Set existing products as 'approved' so they appear in shop
        updateData.status = 'approved';
        needsUpdate = true;
        console.log(`📝 Adding status: approved to ${data.title || data.name || docSnapshot.id}`);
      }
      
      // Add missing fields
      if (!data.views) {
        updateData.views = 0;
        needsUpdate = true;
      }
      
      if (!data.likes) {
        updateData.likes = 0;
        needsUpdate = true;
      }
      
      if (!data.sellerId && data.userId) {
        updateData.sellerId = data.userId;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updateData.updatedAt = serverTimestamp();
        await updateDoc(doc(db, 'products', docSnapshot.id), updateData);
        fixedCount++;
      }
      
      // Count by status
      const status = data.status || updateData.status;
      if (status === 'approved') approvedCount++;
      else if (status === 'pending') pendingCount++;
    }
    
    console.log(`✅ Fixed ${fixedCount} products`);
    console.log(`📊 Approved: ${approvedCount} | Pending: ${pendingCount}`);
    console.log(`🛍️ Shop page will now show ${approvedCount} products`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
fixAllProducts();
