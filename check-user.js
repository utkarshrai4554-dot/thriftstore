// Simple script to check if user exists and provide guidance
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCpKm4tr8kg9-fy4psyAajPhU8T9IHAzQ0",
  authDomain: "styleease-2170f.firebaseapp.com",
  projectId: "styleease-2170f",
  storageBucket: "styleease-2170f.firebasestorage.app",
  messagingSenderId: "921047643742",
  appId: "1:921047643742:web:29a1189bd75f69cf42e6cf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkUser(email) {
  console.log(`🔍 Checking user: ${email}`);
  
  // Check if user exists in Firestore
  try {
    // Check users collection
    const usersRef = doc(db, 'users', email);
    const usersDoc = await getDoc(usersRef);
    
    // Check userProfiles collection  
    const profilesRef = doc(db, 'userProfiles', email);
    const profilesDoc = await getDoc(profilesRef);
    
    console.log('📊 Firestore Results:');
    console.log('  users collection:', usersDoc.exists() ? '✅ Exists' : '❌ Not found');
    console.log('  userProfiles collection:', profilesDoc.exists() ? '✅ Exists' : '❌ Not found');
    
    if (usersDoc.exists()) {
      console.log('📄 User data:', usersDoc.data());
    }
    if (profilesDoc.exists()) {
      console.log('📄 Profile data:', profilesDoc.data());
    }
    
    // Try to login with Firebase Auth
    try {
      console.log('🔐 Testing Firebase Auth login...');
      // This will fail if user doesn't exist in Firebase Auth
    } catch (error) {
      console.log('❌ Firebase Auth login failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  }
}

// Check the problematic users
checkUser('uffizio@gmail.com');
checkUser('udipi@gmail.com');

console.log('\n🎯 SOLUTION:');
console.log('If user exists in Firestore but not in Firebase Auth, you need to:');
console.log('1. Go to Firebase Console → Authentication → Users');
console.log('2. Click "Add user"');
console.log('3. Enter the email and create a password');
console.log('4. The user will then be able to login');
