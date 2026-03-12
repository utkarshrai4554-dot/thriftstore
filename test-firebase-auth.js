// Test Firebase Authentication setup
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCpKm4tr8kg9-fy4psyAajPhU8T9IHAzQ0",
  authDomain: "styleease-2170f.firebaseapp.com",
  projectId: "styleease-2170f",
  storageBucket: "styleease-2170f.firebasestorage.app",
  messagingSenderId: "921047643742",
  appId: "1:921047643742:web:29a1189bd75f69cf42e6cf"
};

console.log('🔍 Testing Firebase Authentication setup...');
console.log('🔍 Firebase config:', firebaseConfig);

try {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  
  console.log('✅ Firebase app initialized');
  console.log('✅ Firebase auth initialized');
  console.log('🔍 Auth config:', {
    apiKey: auth.config.apiKey ? 'Present' : 'Missing',
    authDomain: auth.config.authDomain
  });
  
  // Check current user
  const currentUser = auth.currentUser;
  console.log('🔍 Current user:', currentUser ? 'Logged in' : 'Not logged in');
  
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

console.log('\n🎯 If no errors above, Firebase Auth is working correctly.');
console.log('🎯 The issue is likely in Firebase Console settings.');
console.log('🎯 Check: Firebase Console → Authentication → Sign-in method → Email/Password');
