// Run this in browser console to setup the three collections structure
// This will move existing products to the correct collections

async function setupCollections() {
  console.log('🔧 Setting up collections structure...');
  
  try {
    const { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp } = firebase.firestore();
    
    // Get all existing products from products collection
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    
    let movedToApproved = 0;
    let movedToRejected = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const productId = docSnapshot.id;
      
      // Check if product has status field
      if (data.status) {
        if (data.status === 'approved') {
          // Keep in products collection (already correct)
          console.log(`✅ Product already approved: ${data.title || data.name}`);
          movedToApproved++;
        } else if (data.status === 'rejected') {
          // Move to rejectedProducts collection
          const rejectedRef = doc(db, 'rejectedProducts', productId);
          await setDoc(rejectedRef, {
            ...data,
            rejectedAt: data.rejectedAt || serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          // Delete from products collection
          await deleteDoc(doc(db, 'products', productId));
          console.log(`❌ Moved to rejected: ${data.title || data.name}`);
          movedToRejected++;
        }
      } else {
        // Products without status - set as approved and keep in products collection
        await setDoc(doc(db, 'products', productId), {
          ...data,
          status: 'approved',
          views: data.views || 0,
          likes: data.likes || 0,
          sellerId: data.sellerId || data.userId,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log(`✅ Set as approved: ${data.title || data.name}`);
        movedToApproved++;
      }
    }
    
    console.log(`\n🎉 Setup complete!`);
    console.log(`✅ Approved products: ${movedToApproved} (in products collection)`);
    console.log(`❌ Rejected products: ${movedToRejected} (in rejectedProducts collection)`);
    console.log(`\n📋 Collection structure:`);
    console.log(`📦 sellProducts - New submissions (pending)`);
    console.log(`✅ products - Approved products (shown in shop)`);
    console.log(`❌ rejectedProducts - Rejected products`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the setup
setupCollections();
