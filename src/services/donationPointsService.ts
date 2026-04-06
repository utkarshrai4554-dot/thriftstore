import { doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateDonationPoints, getPointsBreakdownMessage } from '@/utils/pointsCalculator';
import { getUserProfile, saveUpdatedRewardPoints } from './userService';

/**
 * Award points for donation completion
 * @param userId - User ID who made the donation
 * @param donationData - Donation information including items and quantity
 * @returns Promise with points breakdown
 */
export const awardDonationPoints = async (userId: string, donationData: {
  items: string;
  quantity?: number;
  cause: string;
}) => {
  try {
    // Extract quantity from donation data
    const quantity = donationData.quantity || 1;
    
    // Calculate points based on items and quantity
    const pointsBreakdown = calculateDonationPoints(donationData.items, quantity);
    
    console.log(`🎉 Donation points calculation for ${quantity}x "${donationData.items}":`, pointsBreakdown);
    
    // Get current user profile
    const currentProfile = await getUserProfile(userId);
    const currentBasePoints = currentProfile?.rewardPoints || 0;
    const newBasePoints = currentBasePoints + pointsBreakdown.totalPoints;
    
    // Update user's reward points
    await saveUpdatedRewardPoints(userId, newBasePoints);
    
    // Log donation activity
    const donationLogRef = doc(db, 'donationLogs', `${userId}_${Date.now()}`);
    await setDoc(donationLogRef, {
      userId,
      donationData,
      quantity,
      pointsAwarded: pointsBreakdown.totalPoints,
      pointsBreakdown,
      createdAt: serverTimestamp(),
      type: 'donation_points'
    });
    
    console.log(`🎉 Donation points awarded:`);
    console.log(`   - Base points: ${pointsBreakdown.basePoints}`);
    console.log(`   - Item points: ${pointsBreakdown.itemPoints}`);
    console.log(`   - Quantity bonus: ${pointsBreakdown.quantityBonus}`);
    console.log(`   - Total points: ${pointsBreakdown.totalPoints}`);
    console.log(`   - Item type: ${pointsBreakdown.itemType}`);
    console.log(`   - Previous balance: ${currentBasePoints}`);
    console.log(`   - New balance: ${newBasePoints}`);
    
    return {
      success: true,
      pointsBreakdown,
      message: getPointsBreakdownMessage(pointsBreakdown, 'donation'),
      newBalance: newBasePoints
    };
    
  } catch (error) {
    console.error('❌ Error awarding donation points:', error);
    throw new Error(`Failed to award donation points: ${error.message}`);
  }
};

/**
 * Get donation points information for display
 * @returns Donation points configuration
 */
export const getDonationPointsInfo = () => {
  const { getPointsTiers } = require('@/utils/pointsCalculator');
  return getPointsTiers('DONATION');
};

/**
 * Preview donation points before completing donation
 * @param items - Description of donated items
 * @param quantity - Number of items
 * @returns Points breakdown
 */
export const previewDonationPoints = (items: string, quantity: number = 1) => {
  return calculateDonationPoints(items, quantity);
};
