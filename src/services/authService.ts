import { createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile } from './userService';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuthError {
  code: string;
  message: string;
}

export const registerUser = async (email: string, password: string, displayName: string, phone?: string, address?: string, birthdate?: string): Promise<User> => {
  try {
    console.log('🔍 Starting user registration:', { email, displayName, phone, address, birthdate });
    console.log('🔍 Attempting Firebase authentication...');
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase auth successful! User UID:', user.uid);
    console.log('🔍 User email verified:', user.email);
    console.log('🔍 Attempting to create user profile...');
    
    // Save to users collection (main data source for rewards)
    await createUserProfile(user.uid, {
      email: user.email!,
      displayName,
      phone,
      address,
      birthdate,
      rewardPoints: 50,
      role: 'customer',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Also save to userProfiles collection for profile display
    const profileRef = doc(db, 'userProfiles', user.uid);
    await setDoc(profileRef, {
      displayName,
      email: user.email!,
      phone,
      address,
      birthdate,
      rewardPoints: 50,
      role: 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User profile creation completed');
    console.log('🔍 Registration flow completed successfully');
    
    return user;
  } catch (error: any) {
    console.error('❌ Firebase authentication error:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    console.error('❌ Full error details:', JSON.stringify(error, null, 2));
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    } as AuthError;
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    } as AuthError;
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    } as AuthError;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please use a different email or try logging in.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};
