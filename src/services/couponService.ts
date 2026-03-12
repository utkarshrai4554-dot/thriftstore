import { collection, doc, getDoc, addDoc, updateDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface UserPoints {
  id: string;
  userId: string;
  points: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: Date;
}

export const validateCoupon = async (code: string): Promise<Coupon | null> => {
  try {
    const couponsRef = collection(db, 'coupons');
    const q = query(
      couponsRef,
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return null;
    }
    
    const couponDoc = querySnapshot.docs[0];
    const couponData = couponDoc.data();
    
    // Check expiration
    if (couponData.expiresAt && couponData.expiresAt.toDate() < new Date()) {
      return null;
    }
    
    return {
      id: couponDoc.id,
      ...couponData,
      expiresAt: couponData.expiresAt?.toDate(),
      createdAt: couponData.createdAt?.toDate()
    } as Coupon;
  } catch (error) {
    console.error('❌ Error validating coupon:', error);
    return null;
  }
};

export const useCoupon = async (couponId: string, userId: string): Promise<void> => {
  try {
    const couponRef = doc(db, 'coupons', couponId);
    const couponDoc = await getDoc(couponRef);
    
    if (couponDoc.exists()) {
      const couponData = couponDoc.data();
      await updateDoc(couponRef, {
        usedCount: (couponData.usedCount || 0) + 1
      });
    }
  } catch (error) {
    console.error('❌ Error using coupon:', error);
    throw error;
  }
};

export const getUserPoints = async (userId: string): Promise<UserPoints | null> => {
  try {
    const pointsRef = doc(db, 'userPoints', userId);
    const pointsDoc = await getDoc(pointsRef);
    
    if (pointsDoc.exists()) {
      const data = pointsDoc.data();
      return {
        id: pointsDoc.id,
        userId,
        points: data.points || 0,
        totalEarned: data.totalEarned || 0,
        totalSpent: data.totalSpent || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      } as UserPoints;
    }
    
    // Create initial points record if doesn't exist
    await addDoc(collection(db, 'userPoints'), {
      userId,
      points: 100, // Welcome bonus
      totalEarned: 100,
      totalSpent: 0,
      lastUpdated: new Date()
    });
    
    return {
      id: '',
      userId,
      points: 100,
      totalEarned: 100,
      totalSpent: 0,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error('❌ Error fetching user points:', error);
    return null;
  }
};

export const addUserPoints = async (userId: string, pointsToAdd: number, reason: string): Promise<void> => {
  try {
    const pointsRef = doc(db, 'userPoints', userId);
    const pointsDoc = await getDoc(pointsRef);
    
    if (pointsDoc.exists()) {
      const currentData = pointsDoc.data();
      await updateDoc(pointsRef, {
        points: (currentData.points || 0) + pointsToAdd,
        totalEarned: (currentData.totalEarned || 0) + pointsToAdd,
        lastUpdated: new Date()
      });
    }
  } catch (error) {
    console.error('❌ Error adding user points:', error);
    throw error;
  }
};

export const redeemPoints = async (userId: string, pointsToRedeem: number): Promise<void> => {
  try {
    const pointsRef = doc(db, 'userPoints', userId);
    const pointsDoc = await getDoc(pointsRef);
    
    if (pointsDoc.exists()) {
      const currentData = pointsDoc.data();
      const currentPoints = currentData.points || 0;
      
      if (currentPoints >= pointsToRedeem) {
        await updateDoc(pointsRef, {
          points: currentPoints - pointsToRedeem,
          totalSpent: (currentData.totalSpent || 0) + pointsToRedeem,
          lastUpdated: new Date()
        });
      } else {
        throw new Error('Insufficient points');
      }
    }
  } catch (error) {
    console.error('❌ Error redeeming points:', error);
    throw error;
  }
};
