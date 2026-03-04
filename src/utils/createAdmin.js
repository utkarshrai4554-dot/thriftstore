import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export const createAdminUser = async () => {
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
      createdAt: serverTimestamp(),
      isActive: true
    };
    
    await setDoc(doc(db, 'admins', user.email), adminData);
    
    // Also create in users collection for authentication
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: 'StyleEase Admin',
      role: 'admin',
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@styleease.com');
    console.log('🔑 Password: admin123456');
    console.log('🌐 Admin Login: http://localhost:8080/admin/login');
    
    return true;
    
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin user already exists');
      console.log('✅ Admin user is ready to use');
      return true;
    } else {
      console.error('❌ Error creating admin user:', error);
      return false;
    }
  }
};

// Run this function in browser console to create admin
// createAdminUser();
