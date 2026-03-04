import { admin } from '../config/firebase.js';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Initialize Firebase Auth for admin creation
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

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@styleease.com',
      'admin123456'
    );
    
    const user = userCredential.user;
    console.log('✅ User created in Firebase Auth:', user.email);
    
    // Create admin document in Firestore
    const adminData = {
      uid: user.uid,
      email: user.email,
      role: 'admin',
      permissions: [
        'manage_products',
        'manage_orders',
        'manage_users',
        'view_analytics'
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };
    
    await admin.firestore().collection('admins').doc(user.email).set(adminData);
    
    // Also create in users collection for authentication
    await admin.firestore().collection('users').doc(user.uid).set({
      uid: user.uid,
      email: user.email,
      displayName: 'StyleEase Admin',
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@styleease.com');
    console.log('🔑 Password: admin123456');
    console.log('🌐 Admin Login: http://localhost:8080/admin/login');
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists');
      console.log('✅ Admin user is ready to use');
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  }
}

// Run the setup
createAdminUser().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
