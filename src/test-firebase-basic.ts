// Basic Firebase connection test
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const testConfig = {
  apiKey: "AIzaSyCpKm4tr8kg9-fy4psyAajPhU8T9IHAzQ0",
  authDomain: "styleease-2170f.firebaseapp.com",
  projectId: "styleease-2170f",
  storageBucket: "styleease-2170f.firebasestorage.app",
  messagingSenderId: "921047643742",
  appId: "1:921047643742:web:29a1189bd75f69cf42e6cf",
  measurementId: "G-DM4BG77729"
};

export const testBasicFirebaseConnection = async () => {
  try {
    console.log('🔍 Testing basic Firebase connection...');
    
    const testApp = initializeApp(testConfig);
    const testDb = getFirestore(testApp);
    
    // Try to create a simple test document
    const testRef = collection(testDb, 'test');
    await addDoc(testRef, {
      message: 'Firebase connection test',
      timestamp: new Date(),
      test: true
    });
    
    console.log('✅ Basic Firebase connection successful!');
    console.log('✅ Test document created in Firestore');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};

// Run this in browser console: testBasicFirebaseConnection()
