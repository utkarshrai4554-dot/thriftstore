// Test script to verify bonus points deduction functionality
import { deductBonusPoints, addBackBonusPoints, getUserProfile } from './src/services/userService.js';
import { getUserPoints, addUserPoints, redeemPoints } from './src/services/couponService.js';

const testUserId = 'test-user-123';

async function testBonusPointsDeduction() {
  console.log('🧪 Testing Bonus Points Deduction System...\n');
  
  try {
    // Test 1: Get initial user profile
    console.log('📋 Test 1: Getting user profile...');
    const userProfile = await getUserProfile(testUserId);
    console.log('✅ User profile:', userProfile?.rewardPoints || 0, 'points');
    
    // Test 2: Get user points from coupon service
    console.log('\n📋 Test 2: Getting coupon service points...');
    const couponPoints = await getUserPoints(testUserId);
    console.log('✅ Coupon service points:', couponPoints?.points || 0, 'points');
    
    // Test 3: Add some test points
    console.log('\n📋 Test 3: Adding test points...');
    await addUserPoints(testUserId, 100, 'Test addition');
    await addBackBonusPoints(testUserId, 100, 'Test addition');
    console.log('✅ Added 100 test points to both systems');
    
    // Test 4: Test deduction
    console.log('\n📋 Test 4: Testing bonus points deduction...');
    const deductResult = await deductBonusPoints(testUserId, 50);
    console.log('✅ Deduction result:', deductResult);
    
    // Test 5: Test rollback (add back)
    console.log('\n📋 Test 5: Testing rollback (add back)...');
    const addBackResult = await addBackBonusPoints(testUserId, 50, 'Test rollback');
    console.log('✅ Add back result:', addBackResult);
    
    // Test 6: Test insufficient points
    console.log('\n📋 Test 6: Testing insufficient points...');
    try {
      await deductBonusPoints(testUserId, 1000);
      console.log('❌ Should have failed with insufficient points');
    } catch (error) {
      console.log('✅ Correctly handled insufficient points:', error.message);
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testBonusPointsDeduction();
