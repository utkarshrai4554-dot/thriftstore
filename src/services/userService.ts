import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastLoginAt?: Date | Timestamp;
  isActive: boolean;
}

export const createUserProfile = async (uid: string, userData: Omit<UserProfile, 'uid' | 'isActive'>): Promise<void> => {
  try {
    console.log('🔍 Creating user profile with UID:', uid);
    console.log('🔍 User data to save:', userData);
    const userRef = doc(db, 'users', uid);
    console.log('🔍 Document reference created:', userRef.path);
    const userProfile: UserProfile = {
      uid,
      ...userData,
      isActive: true
    };
    console.log('🔍 Final user profile object:', userProfile);
    console.log('🔍 Attempting to save to Firestore...');
    await setDoc(userRef, userProfile);
    console.log('✅ User profile created successfully');
  } catch (error: any) {
    console.error('❌ Error creating user profile:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    throw new Error(`Failed to create user profile: ${error.message}`);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
};

export const updateUserLastLogin = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(`Failed to update last login: ${error.message}`);
  }
};

export const deleteUserProfile = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await deleteDoc(userRef);
  } catch (error: any) {
    throw new Error(`Failed to delete user profile: ${error.message}`);
  }
};

export const getUserByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to get user by email: ${error.message}`);
  }
};

export const deactivateUser = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isActive: false,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(`Failed to deactivate user: ${error.message}`);
  }
};

export const activateUser = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isActive: true,
      updatedAt: new Date()
    });
  } catch (error: any) {
    throw new Error(`Failed to activate user: ${error.message}`);
  }
};
