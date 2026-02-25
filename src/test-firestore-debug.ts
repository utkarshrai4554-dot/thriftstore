// Debug script to test Firestore connection
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCpKm4tr8kg9-fy4psyAajPhU8T9IHAzQ0",
  authDomain: "styleease-2170f.firebaseapp.com",
  projectId: "styleease-2170f",
  storageBucket: "styleease-2170f.firebasestorage.app",
  messagingSenderId: "921047643742",
  appId: "1:921047643742:web:29a1189bd75f69cf42e6cf",
  measurementId: "G-DM4BG77729"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export const testFirestoreConnection = async () => {
  console.log('🔍 Testing Firestore connection...');
  
  try {
    // Test anonymous sign in
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous sign in successful:', userCredential.user.uid);
    
    // Test writing to Firestore
    const testRef = doc(db, 'test', userCredential.user.uid);
    await setDoc(testRef, {
      message: 'Test message',
      timestamp: new Date()
    });
    console.log('✅ Write to Firestore successful');
    
    // Test reading from Firestore
    const testDoc = await getDoc(testRef);
    if (testDoc.exists()) {
      console.log('✅ Read from Firestore successful:', testDoc.data());
    } else {
      console.log('❌ Document does not exist');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    return false;
  }
};

// Run this in browser console: testFirestoreConnection()
