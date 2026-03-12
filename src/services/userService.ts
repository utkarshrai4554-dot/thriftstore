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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  birthdate?: string;
  rewardPoints?: number;
  birthdayRewardPoints?: number;
  birthdayRewardExpiry?: Date | Timestamp;
  lastBirthdayReward?: Date | Timestamp;
  role?: 'customer' | 'admin' | 'seller' | 'ngo';
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
    console.log('🔍 Getting user profile for UID:', uid);
    
    // First check regular user profile
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    console.log('🔍 User profile exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const profile = userDoc.data() as UserProfile;
      console.log('🔍 Current user profile role:', profile.role);
      
      // Check if user is an NGO using queries (like Profile.tsx)
      const ngoQuery = query(
        collection(db, 'ngoRegistrations'),
        where('uid', '==', uid)
      );
      const ngoSnapshot = await getDocs(ngoQuery);
      
      const approvedNGOQuery = query(
        collection(db, 'approvedNGOs'),
        where('uid', '==', uid)
      );
      const approvedNGOSnapshot = await getDocs(approvedNGOQuery);
      
      console.log('🔍 NGO Snapshot size:', ngoSnapshot.size);
      console.log('🔍 Approved NGO Snapshot size:', approvedNGOSnapshot.size);
      
      let ngoData = null;
      let isNGO = false;
      
      if (!approvedNGOSnapshot.empty && approvedNGOSnapshot.docs[0].data()?.status === 'approved') {
        ngoData = approvedNGOSnapshot.docs[0].data();
        isNGO = true;
        console.log('🔍 User is approved NGO');
      } else if (!ngoSnapshot.empty) {
        ngoData = ngoSnapshot.docs[0].data();
        isNGO = true;
        console.log('🔍 User is registered NGO');
      }
      
      // If user is NGO, update profile with NGO role
      if (isNGO && profile.role !== 'ngo') {
        console.log('🔍 Updating user profile role to NGO');
        await updateUserProfile(uid, { role: 'ngo' });
        return {
          ...profile,
          role: 'ngo'
        };
      }
      
      console.log('🔍 Returning profile with role:', profile.role);
      return profile;
    }
    
    // If no user profile, check if user is an NGO directly using queries
    console.log('🔍 No user profile found, checking NGO status directly');
    const ngoQuery = query(
      collection(db, 'ngoRegistrations'),
      where('uid', '==', uid)
    );
    const ngoSnapshot = await getDocs(ngoQuery);
    
    const approvedNGOQuery = query(
      collection(db, 'approvedNGOs'),
      where('uid', '==', uid)
    );
    const approvedNGOSnapshot = await getDocs(approvedNGOQuery);
    
    if (!approvedNGOSnapshot.empty && approvedNGOSnapshot.docs[0].data()?.status === 'approved') {
      const ngoData = approvedNGOSnapshot.docs[0].data();
      console.log('🔍 Creating user profile for approved NGO');
      // Create user profile with NGO role
      const userProfile: UserProfile = {
        uid,
        email: ngoData.email || '',
        displayName: ngoData.name || '',
        role: 'ngo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await createUserProfile(uid, userProfile);
      return userProfile;
    }
    
    if (!ngoSnapshot.empty) {
      const ngoData = ngoSnapshot.docs[0].data();
      console.log('🔍 Creating user profile for registered NGO');
      // Create user profile with NGO role (pending)
      const userProfile: UserProfile = {
        uid,
        email: ngoData.email || '',
        displayName: ngoData.name || '',
        role: 'ngo',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await createUserProfile(uid, userProfile);
      return userProfile;
    }
    
    console.log('🔍 No user profile or NGO status found');
    return null;
  } catch (error: any) {
    console.error('❌ Error getting user profile:', error);
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

export const checkAndAwardBirthdayReward = async (uid: string): Promise<{ awarded: boolean; message: string }> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { awarded: false, message: 'User profile not found' };
    }

    const userData = userDoc.data() as UserProfile;
    
    // Check if user has birthdate set
    if (!userData.birthdate) {
      return { awarded: false, message: 'No birthdate set' };
    }

    // Check if birthday reward has already been awarded this year
    const today = new Date();
    
    if (userData.lastBirthdayReward) {
      const lastRewardDate = userData.lastBirthdayReward instanceof Date 
        ? userData.lastBirthdayReward 
        : userData.lastBirthdayReward.toDate();
      
      // Check if birthday reward was already awarded this year (same year, month, and day)
      if (lastRewardDate.getFullYear() === today.getFullYear() &&
          lastRewardDate.getMonth() === today.getMonth() &&
          lastRewardDate.getDate() === today.getDate()) {
        return { awarded: false, message: 'Birthday reward already awarded this year' };
      }
    }

    // Check if today is the user's birthday (date and month only, excluding year)
    const birthdate = new Date(userData.birthdate);
    const isBirthday = (
      today.getMonth() === birthdate.getMonth() &&
      today.getDate() === birthdate.getDate()
    );

    if (!isBirthday) {
      return { awarded: false, message: 'Today is not your birthday' };
    }

    // Award birthday points (50 points valid for 30 days)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    // Get current base points to calculate total
    const currentBasePoints = userData.rewardPoints || 0;
    const totalPoints = currentBasePoints + 50;

    await updateDoc(userRef, {
      rewardPoints: totalPoints, // Store total points (base + birthday bonus)
      birthdayRewardPoints: 50,
      birthdayRewardExpiry: expiryDate,
      lastBirthdayReward: today,
      updatedAt: new Date()
    });

    return { awarded: true, message: 'Happy Birthday! 50 reward points awarded, valid for 30 days!' };
  } catch (error: any) {
    throw new Error(`Failed to check birthday reward: ${error.message}`);
  }
};

// New function to get countdown to next birthday
export const getBirthdayCountdown = (birthdate: string): { days: number; hours: number; minutes: number; seconds: number; timeString: string } | null => {
  if (!birthdate) return null;

  const today = new Date();
  const birthDate = new Date(birthdate);
  
  // Create next birthday date (current year)
  let nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  
  // If birthday has passed this year, set it for next year
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }
  
  const timeDiff = nextBirthday.getTime() - today.getTime();
  
  if (timeDiff <= 0) return null;
  
  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
  let timeString = '';
  if (days > 0) {
    timeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    timeString = `${hours}h ${minutes}m ${seconds}s`;
  } else {
    timeString = `${minutes}m ${seconds}s`;
  }
  
  return { days, hours, minutes, seconds, timeString };
};

// New function to check if birthday is within countdown period (e.g., 7 days before)
export const isBirthdayApproaching = (birthdate: string, daysBefore: number = 7): boolean => {
  if (!birthdate) return false;
  
  const countdown = getBirthdayCountdown(birthdate);
  if (!countdown) return false;
  
  return countdown.days <= daysBefore;
};

// Enhanced function to automatically check birthday rewards for all users (admin function)
export const checkAllUsersBirthdayRewards = async (): Promise<{ processed: number; awarded: number }> => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    let processed = 0;
    let awarded = 0;
    
    for (const userDoc of querySnapshot.docs) {
      processed++;
      const result = await checkAndAwardBirthdayReward(userDoc.id);
      if (result.awarded) {
        awarded++;
      }
    }
    
    return { processed, awarded };
  } catch (error: any) {
    throw new Error(`Failed to check all users birthday rewards: ${error.message}`);
  }
};

export const getTotalRewardPoints = (userData: UserProfile): number => {
  const basePoints = userData.rewardPoints || 0;
  const birthdayPoints = userData.birthdayRewardPoints || 0;
  
  // Check if birthday points have expired
  if (userData.birthdayRewardExpiry) {
    const expiryDate = userData.birthdayRewardExpiry instanceof Date 
      ? userData.birthdayRewardExpiry 
      : userData.birthdayRewardExpiry.toDate();
    if (new Date() > expiryDate) {
      return basePoints; // Birthday points expired
    }
  }
  
  return basePoints + birthdayPoints;
};

export const hasValidBirthdayReward = (userData: UserProfile): boolean => {
  if (!userData.birthdayRewardPoints || !userData.birthdayRewardExpiry) {
    return false;
  }
  
  const expiryDate = userData.birthdayRewardExpiry instanceof Date 
    ? userData.birthdayRewardExpiry 
    : userData.birthdayRewardExpiry.toDate();
  return new Date() <= expiryDate;
};

export const cleanupExpiredBirthdayRewards = async (uid: string): Promise<{ cleaned: boolean; message: string }> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { cleaned: false, message: 'User profile not found' };
    }

    const userData = userDoc.data() as UserProfile;
    
    // Check if birthday reward has expired
    if (userData.birthdayRewardPoints && userData.birthdayRewardExpiry) {
      const expiryDate = userData.birthdayRewardExpiry instanceof Date 
        ? userData.birthdayRewardExpiry 
        : userData.birthdayRewardExpiry.toDate();
      
      if (new Date() > expiryDate) {
        // Remove expired birthday reward and subtract from total rewardPoints
        const currentTotalPoints = userData.rewardPoints || 0;
        const birthdayPoints = userData.birthdayRewardPoints || 0;
        const newTotalPoints = currentTotalPoints - birthdayPoints;

        await updateDoc(userRef, {
          rewardPoints: newTotalPoints, // Subtract birthday bonus from total
          birthdayRewardPoints: 0,
          birthdayRewardExpiry: null,
          updatedAt: new Date()
        });

        // Also update userProfiles collection to keep it in sync
        const profileRef = doc(db, 'userProfiles', uid);
        await updateDoc(profileRef, {
          rewardPoints: newTotalPoints, // Subtract birthday bonus from total
          birthdayRewardPoints: 0,
          birthdayRewardExpiry: null,
          updatedAt: serverTimestamp()
        });
        
        return { 
          cleaned: true, 
          message: 'Birthday bonus points have expired and been removed from your account.' 
        };
      }
    }
    
    return { cleaned: false, message: 'No expired birthday rewards found.' };
  } catch (error: any) {
    throw new Error(`Failed to cleanup expired birthday rewards: ${error.message}`);
  }
};

export const saveUpdatedRewardPoints = async (uid: string, totalPoints: number): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const profileRef = doc(db, 'userProfiles', uid);
    
    // Store total points (base + birthday bonus) as rewardPoints in both collections
    await Promise.all([
      updateDoc(userRef, {
        rewardPoints: totalPoints,
        updatedAt: new Date()
      }),
      updateDoc(profileRef, {
        rewardPoints: totalPoints,
        updatedAt: serverTimestamp()
      })
    ]);
    
    console.log('✅ Updated total reward points saved to database');
  } catch (error: any) {
    throw new Error(`Failed to save updated reward points: ${error.message}`);
  }
};

export const migrateExistingUserPoints = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const profileRef = doc(db, 'userProfiles', uid);
    
    // Check both collections and add missing fields
    const [userDoc, profileDoc] = await Promise.all([
      getDoc(userRef),
      getDoc(profileRef)
    ]);
    
    const updates: any = { updatedAt: new Date() };
    
    // Update users collection if fields are missing
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.rewardPoints === undefined) {
        updates.rewardPoints = 50;
      }
      if (userData.role === undefined) {
        updates.role = 'customer';
      }
      
      if (Object.keys(updates).length > 1) { // More than just updatedAt
        await updateDoc(userRef, updates);
        console.log('✅ Added missing fields to users collection for user:', uid);
      }
    }
    
    // Update userProfiles collection if fields are missing
    const profileUpdates: any = { updatedAt: serverTimestamp() };
    if (profileDoc.exists()) {
      const profileData = profileDoc.data();
      if (profileData.rewardPoints === undefined) {
        profileUpdates.rewardPoints = 50;
      }
      if (profileData.role === undefined) {
        profileUpdates.role = 'customer';
      }
      
      if (Object.keys(profileUpdates).length > 1) { // More than just updatedAt
        await updateDoc(profileRef, profileUpdates);
        console.log('✅ Added missing fields to userProfiles collection for user:', uid);
      }
    }
    
  } catch (error: any) {
    console.error('❌ Error migrating user points:', error);
    throw new Error(`Failed to migrate user points: ${error.message}`);
  }
};

export const ensureUserHasRewardPoints = async (uid: string): Promise<void> => {
  try {
    const userProfile = await getUserProfile(uid);
    
    if (!userProfile || userProfile.rewardPoints === undefined) {
      await migrateExistingUserPoints(uid);
    }
    
    // Fix users who have separate birthday reward points that aren't combined
    if (userProfile && userProfile.birthdayRewardPoints && userProfile.birthdayRewardExpiry) {
      const hasValidBonus = hasValidBirthdayReward(userProfile);
      const currentTotal = userProfile.rewardPoints || 0;
      const birthdayPoints = userProfile.birthdayRewardPoints || 0;
      
      console.log('🔍 Checking birthday reward points for user:', uid);
      console.log('🔍 Current total points:', currentTotal);
      console.log('🔍 Birthday bonus points:', birthdayPoints);
      console.log('🔍 Has valid bonus:', hasValidBonus);
      console.log('🔍 Expiry date:', userProfile.birthdayRewardExpiry);
      
      // If birthday bonus is valid but not included in total, add it
      if (hasValidBonus && currentTotal < birthdayPoints) {
        const newTotal = currentTotal + birthdayPoints;
        console.log('🔍 Adding birthday bonus to total:', newTotal);
        await saveUpdatedRewardPoints(uid, newTotal);
        console.log('✅ Fixed separate birthday reward points for user:', uid);
      }
      // If birthday bonus is expired but still counted in total, subtract it
      else if (!hasValidBonus && currentTotal >= birthdayPoints) {
        const newTotal = currentTotal - birthdayPoints;
        console.log('🔍 Removing expired birthday bonus from total:', newTotal);
        await saveUpdatedRewardPoints(uid, newTotal);
        console.log('✅ Removed expired birthday reward points from total for user:', uid);
      } else {
        console.log('✅ Birthday reward points are correctly combined');
      }
    }
  } catch (error) {
    // If user doesn't exist in users collection, create them with default points
    await migrateExistingUserPoints(uid);
  }
};

export const manuallyAddBirthdayBonus = async (uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User profile not found' };
    }

    const userData = userDoc.data() as UserProfile;
    const currentPoints = userData.rewardPoints || 0;
    
    // Add 50 birthday bonus with 30 day expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    
    const totalPoints = currentPoints + 50;
    
    await updateDoc(userRef, {
      rewardPoints: totalPoints,
      birthdayRewardPoints: 50,
      birthdayRewardExpiry: expiryDate,
      lastBirthdayReward: new Date(),
      updatedAt: new Date()
    });

    // Also update userProfiles collection
    const profileRef = doc(db, 'userProfiles', uid);
    await updateDoc(profileRef, {
      rewardPoints: totalPoints,
      birthdayRewardPoints: 50,
      birthdayRewardExpiry: expiryDate,
      updatedAt: serverTimestamp()
    });
    
    return { 
      success: true, 
      message: 'Birthday bonus manually added! 50 points valid for 30 days.' 
    };
  } catch (error: any) {
      throw new Error(`Failed to manually add birthday bonus: ${error.message}`);
    }
};
