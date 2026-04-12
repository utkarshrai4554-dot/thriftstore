import { createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { createUserProfile } from './userService';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AuthError {
  code: string;
  message: string;
}

export const registerUser = async (email: string, password: string, displayName: string, phone?: string, address?: string, birthdate?: string): Promise<User> => {
  try {
    console.log('🔍 Starting user registration:', { email, displayName, phone, address, birthdate });
    console.log('🔍 Attempting Firebase authentication...');
    
    // First, create user in Firebase Authentication
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('✅ Firebase auth successful! User UID:', user.uid);
    console.log('🔍 User email verified:', user.email);
    console.log('🔍 Attempting to create user profile...');
    
    // Only save to Firestore if Firebase Auth was successful
    await createUserProfile(user.uid, {
      email: user.email!,
      displayName,
      phone,
      address,
      birthdate,
      rewardPoints: 50, // Award 50 points for registration
      role: 'customer',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Also save to userProfiles collection for profile display - using UID as document ID
    const profileRef = doc(db, 'userProfiles', user.uid);
    await setDoc(profileRef, {
      displayName,
      email: user.email!,
      phone,
      address,
      birthdate,
      rewardPoints: 0,
      role: 'customer',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ User profile creation completed');
    console.log('🔍 Registration flow completed successfully');
    
    return user;
    
  } catch (error: any) {
    console.error('❌ Firebase registration error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    
    // Don't save to Firestore if Firebase Auth failed
    throw {
      code: error.code,
      message: getErrorMessage(error.code)
    } as AuthError;
  }
};

export const registerDeliveryGuy = async (
  email: string, 
  password: string, 
  displayName: string, 
  phone: string,
  vehicleType: string,
  vehicleNumber: string,
  drivingLicense: string,
  address: string,
  experience?: string,
  availability?: string
): Promise<string> => {
  try {
    console.log('🚚 Starting delivery guy registration request:', { 
      email, 
      displayName, 
      phone,
      vehicleType,
      vehicleNumber,
      availability
    });
    
    // Create delivery agent request instead of direct registration
    const { createDeliveryAgentRequest } = await import('./deliveryAgentService');
    const requestId = await createDeliveryAgentRequest(email, {
      displayName,
      phone,
      vehicleType,
      vehicleNumber,
      drivingLicense,
      address,
      experience,
      availability
    });
    
    console.log('✅ Delivery agent request created successfully:', requestId);
    console.log('📧 Request sent to admin for approval');
    
    return requestId;
    
  } catch (error: any) {
    console.error('❌ Delivery guy registration request error:', error);
    
    // Handle specific errors
    let authError: AuthError;
    
    if (error.code === 'auth/email-already-in-use') {
      authError = {
        code: error.code,
        message: 'An account with this email already exists. Please try logging in instead.'
      };
    } else if (error.code === 'auth/weak-password') {
      authError = {
        code: error.code,
        message: 'Password is too weak. Please choose a stronger password with at least 6 characters.'
      };
    } else if (error.code === 'auth/invalid-email') {
      authError = {
        code: error.code,
        message: 'Invalid email address. Please enter a valid email.'
      };
    } else if (error.code === 'auth/network-request-failed') {
      authError = {
        code: error.code,
        message: 'Network error. Please check your internet connection and try again.'
      };
    } else {
      authError = {
        code: error.code || 'unknown',
        message: error.message || 'Registration request failed. Please try again.'
      };
    }
    
    console.error('❌ Auth error details:', authError);
    throw authError;
  }
};

export const checkUserExists = async (email: string): Promise<{ inAuth: boolean; inFirestore: boolean }> => {
  try {
    // Check in Firestore
    const usersRef = doc(db, 'users', email);
    const userDoc = await getDoc(usersRef);
    const inFirestore = userDoc.exists();
    
    // Try to check in Firebase Auth (this will fail if user doesn't exist)
    let inAuth = false;
    try {
      // We can't directly check if user exists in Auth without password
      // But if they're in Firestore, they should have been created in Auth during registration
      inAuth = inFirestore; // Assume if in Firestore, they should be in Auth
    } catch (error) {
      inAuth = false;
    }
    
    return { inAuth, inFirestore };
  } catch (error) {
    console.error('Error checking user existence:', error);
    return { inAuth: false, inFirestore: false };
  }
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔍 Attempting login with email:', email);
    console.log('🔍 Firebase auth config:', {
      apiKey: auth.config.apiKey ? 'Present' : 'Missing',
      authDomain: auth.config.authDomain
    });
    
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Firebase auth successful for user:', userCredential.user.email);
    
    // Check if user is a delivery agent and if they are approved
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.role === 'delivery') {
        console.log('User is a delivery agent, checking approval status...');
        
        // Check delivery agent approval status
        const deliveryAgentDoc = await getDoc(doc(db, 'deliveryAgents', userCredential.user.uid));
        if (!deliveryAgentDoc.exists()) {
          console.log('Delivery agent not found in system');
          await signOut(auth);
          throw {
            code: 'auth/delivery-agent-not-found',
            message: 'Your delivery agent account is not properly set up. Please contact support.'
          } as AuthError;
        }
        
        const agentData = deliveryAgentDoc.data();
        if (agentData.status !== 'approved') {
          console.log('Delivery agent not approved:', agentData.status);
          await signOut(auth);
          throw {
            code: 'auth/delivery-agent-not-approved',
            message: 'Your delivery agent application is still pending approval. Please wait for admin approval.'
          } as AuthError;
        }
        
        console.log('Delivery agent is approved and can login');
      }
    }
    
    console.log('Login successful for user:', userCredential.user.email);
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Firebase login error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    
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
  const user = auth.currentUser;
  if (user) {
    console.log('🔍 Current Firebase Auth User:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    });
  }
  return user;
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
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    default:
      return 'An error occurred. Please try again.';
  }
};
