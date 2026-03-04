import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Create admin user
export const createAdminUser = async (email, password, name) => {
  try {
    // Create user in Firebase Auth (you'll need to implement this)
    // For now, we'll create admin document in Firestore
    
    const adminData = {
      email: email,
      name: name,
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

    // Save admin data to Firestore
    await setDoc(doc(db, 'admins', email), adminData);
    
    console.log('Admin user created successfully');
    return true;
  } catch (error) {
    console.error('Error creating admin user:', error);
    return false;
  }
};

// Check if user is admin
export const isAdminUser = async (email) => {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', email));
    return adminDoc.exists() && adminDoc.data().isActive;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Default admin credentials (for development)
export const DEFAULT_ADMIN = {
  email: 'admin@styleease.com',
  password: 'admin123456',
  name: 'StyleEase Admin'
};

// Initialize default admin
export const initializeDefaultAdmin = async () => {
  try {
    const adminExists = await isAdminUser(DEFAULT_ADMIN.email);
    
    if (!adminExists) {
      await createAdminUser(DEFAULT_ADMIN.email, DEFAULT_ADMIN.password, DEFAULT_ADMIN.name);
      console.log('Default admin user created');
    }
  } catch (error) {
    console.error('Error initializing default admin:', error);
  }
};
