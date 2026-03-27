// Run this in browser console to test Firebase connection
// This will help identify the exact issue

async function testFirebaseConnection() {
  console.log('🔍 Testing Firebase connection...');
  
  try {
    // Test 1: Check if Firebase is initialized
    console.log('1. Firebase initialized:', !!firebase);
    console.log('2. Firestore available:', !!firebase.firestore);
    
    const db = firebase.firestore();
    console.log('3. DB instance:', !!db);
    
    // Test 2: Try to access collections
    const { collection, getDocs } = firebase.firestore();
    
    console.log('\n📦 Testing sellProducts collection:');
    try {
      const sellRef = collection(db, 'sellProducts');
      const sellSnapshot = await getDocs(sellRef);
      console.log(`✅ sellProducts accessible: ${sellSnapshot.size} documents`);
    } catch (error) {
      console.log('❌ sellProducts error:', error.message);
    }
    
    console.log('\n✅ Testing products collection:');
    try {
      const prodRef = collection(db, 'products');
      const prodSnapshot = await getDocs(prodRef);
      console.log(`✅ products accessible: ${prodSnapshot.size} documents`);
    } catch (error) {
      console.log('❌ products error:', error.message);
    }
    
    // Test 3: Try to create a test document
    console.log('\n🧪 Testing write permission:');
    try {
      const testRef = doc(db, 'sellProducts', 'test_' + Date.now());
      await setDoc(testRef, {
        title: 'Test Product',
        status: 'pending',
        createdAt: new Date(),
        sellerId: 'test'
      });
      console.log('✅ Write permission OK');
      
      // Clean up
      await deleteDoc(testRef);
      console.log('✅ Delete permission OK');
    } catch (error) {
      console.log('❌ Write permission error:', error.message);
    }
    
    // Test 4: Check admin dashboard data structure
    console.log('\n🎯 Testing admin dashboard query:');
    try {
      const { query, where, orderBy } = firebase.firestore();
      const q = query(
        collection(db, 'sellProducts'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log(`✅ Admin query works: ${querySnapshot.size} pending products`);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ${data.title || 'No title'} (${data.status})`);
      });
    } catch (error) {
      console.log('❌ Admin query error:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
  }
}

// Run the test
testFirebaseConnection();
