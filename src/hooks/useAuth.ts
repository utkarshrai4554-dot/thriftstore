import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile, updateUserLastLogin } from '../services/userService';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role?: 'customer' | 'admin' | 'ngo' | 'seller';
  photoURL?: string;
  phoneNumber?: string;
  lastLoginAt?: any;
  rewardPoints?: number;
  birthdayRewardPoints?: number;
  birthdayRewardExpiry?: Date | Timestamp;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastLoginAt?: any;
}

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth State Changed - User:', user?.uid);
      setUser(user);
      
      if (user) {
        try {
          console.log('🔍 useAuth - Fetching user profile for:', user.uid);
          const profile = await getUserProfile(user.uid);
          console.log('🔍 useAuth - User profile fetched:', profile);
          setUserProfile(profile);
          
          if (profile) {
            await updateUserLastLogin(user.uid);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    logout
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};
