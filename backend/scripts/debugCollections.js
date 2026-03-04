// Run this in browser console to debug collections
// This will show what's in each collection

async function debugCollections() {
  console.log('🔍 Debugging collections...');
  
  try {
    const { collection, getDocs } = firebase.firestore();
    
    // Check sellProducts collection
    console.log('\n📦 sellProducts collection:');
    const sellProductsRef = collection(db, 'sellProducts');
    const sellSnapshot = await getDocs(sellProductsRef);
    console.log(`Total documents: ${sellSnapshot.size}`);
    
    sellSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title || data.name} (status: ${data.status})`);
    });
    
    // Check products collection
    console.log('\n✅ products collection:');
    const productsRef = collection(db, 'products');
    const productSnapshot = await getDocs(productsRef);
    console.log(`Total documents: ${productSnapshot.size}`);
    
    productSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title || data.name} (status: ${data.status})`);
    });
    
    // Check rejectedProducts collection
    console.log('\n❌ rejectedProducts collection:');
    const rejectedRef = collection(db, 'rejectedProducts');
    const rejectedSnapshot = await getDocs(rejectedRef);
    console.log(`Total documents: ${rejectedSnapshot.size}`);
    
    rejectedSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`- ${doc.id}: ${data.title || data.name} (status: ${data.status})`);
    });
    
    console.log('\n🎯 Admin Dashboard should show products from sellProducts with status: pending');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the debug
debugCollections();
