// Test script to verify points deduction and display update
import { getUserProfile, deductBonusPoints } from './src/services/userService.js';

const testUserId = 'your-test-user-id'; // Replace with actual user ID

async function testPointsDeductionFlow() {
  console.log('🧪 Testing Complete Points Deduction Flow...\n');
  
  try {
    // Step 1: Check initial points
    console.log('📋 Step 1: Getting initial points...');
    const initialProfile = await getUserProfile(testUserId);
    const initialPoints = initialProfile?.rewardPoints || 0;
    console.log('✅ Initial bonus points:', initialPoints);
    
    if (initialPoints === 0) {
      console.log('⚠️  No points to test with. Please add some points first.');
      return;
    }
    
    // Step 2: Test deduction
    const pointsToUse = Math.min(10, initialPoints); // Use 10 points or whatever is available
    console.log(`\n📋 Step 2: Testing deduction of ${pointsToUse} points...`);
    
    const deductionResult = await deductBonusPoints(testUserId, pointsToUse);
    if (deductionResult.success) {
      console.log('✅ Deduction successful!');
      console.log(`   - Points deducted: ${pointsToUse}`);
      console.log(`   - New balance: ${deductionResult.newBalance}`);
      
      // Step 3: Verify database was updated
      console.log('\n📋 Step 3: Verifying database update...');
      const updatedProfile = await getUserProfile(testUserId);
      const actualNewPoints = updatedProfile?.rewardPoints || 0;
      
      console.log('✅ Database verification:');
      console.log(`   - Expected balance: ${deductionResult.newBalance}`);
      console.log(`   - Actual balance: ${actualNewPoints}`);
      
      if (actualNewPoints === deductionResult.newBalance) {
        console.log('🎉 SUCCESS: Database updated correctly!');
        
        // Step 4: Simulate cart state update
        console.log('\n📋 Step 4: Simulating cart state update...');
        console.log(`🔄 Cart should now display: ${actualNewPoints} points`);
        console.log('✅ Cart state would be updated with: setUserPoints({ points: ' + actualNewPoints + ' })');
        
      } else {
        console.log('❌ ERROR: Database not updated correctly!');
        console.log(`   - Expected: ${deductionResult.newBalance}`);
        console.log(`   - Actual: ${actualNewPoints}`);
      }
      
    } else {
      console.log('❌ Deduction failed:', deductionResult.message);
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPointsDeductionFlow();
