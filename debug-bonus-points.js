// Debug script to check and test bonus points deduction
import { getUserProfile, deductBonusPoints, ensureUserHasRewardPoints } from './src/services/userService.js';

async function debugBonusPoints() {
  const testUserId = 'your-test-user-id'; // Replace with actual user ID
  
  console.log('🔍 Debugging Bonus Points System...\n');
  
  try {
    // Step 1: Check user profile
    console.log('📋 Step 1: Checking user profile...');
    const profile = await getUserProfile(testUserId);
    if (!profile) {
      console.log('❌ User profile not found');
      return;
    }
    
    console.log('✅ User profile found:');
    console.log('   - UID:', profile.uid);
    console.log('   - Email:', profile.email);
    console.log('   - Reward Points:', profile.rewardPoints || 0);
    console.log('   - Birthday Points:', profile.birthdayRewardPoints || 0);
    
    // Step 2: Ensure reward points are initialized
    console.log('\n📋 Step 2: Ensuring reward points are initialized...');
    await ensureUserHasRewardPoints(testUserId);
    console.log('✅ Reward points initialization completed');
    
    // Step 3: Check updated profile
    console.log('\n📋 Step 3: Checking updated profile...');
    const updatedProfile = await getUserProfile(testUserId);
    console.log('✅ Updated Reward Points:', updatedProfile?.rewardPoints || 0);
    
    // Step 4: Test deduction (only if user has points)
    if (updatedProfile?.rewardPoints > 0) {
      console.log('\n📋 Step 4: Testing points deduction...');
      const deductResult = await deductBonusPoints(testUserId, 10);
      console.log('✅ Deduction result:', deductResult);
      
      // Step 5: Check final balance
      console.log('\n📋 Step 5: Checking final balance...');
      const finalProfile = await getUserProfile(testUserId);
      console.log('✅ Final Reward Points:', finalProfile?.rewardPoints || 0);
    } else {
      console.log('\n⚠️  No points available for testing deduction');
    }
    
    console.log('\n🎉 Debug completed successfully!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugBonusPoints();
