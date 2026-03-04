import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// This function creates the admin document in Firestore
// Run this in browser console after creating the auth user
export const setupAdminDocument = async (userUid) => {
  try {
    console.log('🔧 Setting up admin document...');
    
    const adminData = {
      uid: userUid,
      email: 'admin@styleease.com',
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
    
    await setDoc(doc(db, 'admins', 'admin@styleease.com'), adminData);
    
    console.log('✅ Admin document created successfully!');
    console.log('📧 Email: admin@styleease.com');
    console.log('🔑 Password: admin123456');
    console.log('🌐 Admin Login: http://localhost:8080/admin/login');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error setting up admin document:', error);
    return false;
  }
};

// Run this in browser console after creating the auth user:
// setupAdminDocument('USER_UID_HERE');
