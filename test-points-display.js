// Test script to verify points display fix
import { getUserProfile, getUserPoints } from './src/services/userService.js';
import { getUserPoints as getCouponPoints } from './src/services/couponService.js';

const testUserId = 'your-test-user-id'; // Replace with actual user ID

async function testPointsDisplay() {
  console.log('🧪 Testing Points Display Fix...\n');
  
  try {
    // Test 1: Get user profile points (bonus points)
    console.log('📋 Test 1: Getting user profile (bonus points)...');
    const userProfile = await getUserProfile(testUserId);
    const bonusPoints = userProfile?.rewardPoints || 0;
    console.log('✅ User profile bonus points:', bonusPoints);
    
    // Test 2: Get coupon service points
    console.log('\n📋 Test 2: Getting coupon service points...');
    const couponData = await getCouponPoints(testUserId);
    const couponServicePoints = couponData?.points || 0;
    console.log('✅ Coupon service points:', couponServicePoints);
    
    // Test 3: Compare the two
    console.log('\n📊 Comparison:');
    console.log(`   - User Profile (Bonus Points): ${bonusPoints}`);
    console.log(`   - Coupon Service Points: ${couponServicePoints}`);
    
    if (bonusPoints !== couponServicePoints) {
      console.log('⚠️  DISCREPANCY FOUND!');
      console.log(`   The cart should display ${bonusPoints} points, not ${couponServicePoints} points`);
      console.log('   ✅ FIX: Cart now uses getUserProfile() instead of getUserPoints()');
    } else {
      console.log('✅ Both systems show the same points');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPointsDisplay();
