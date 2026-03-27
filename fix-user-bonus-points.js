// Fix script to ensure bonus points are properly deducted from user profile
// Run this script to fix any existing issues with user profiles

import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase.js';

async function fixUserBonusPoints() {
  console.log('🔧 Fixing User Bonus Points System...\n');
  
  try {
    // Step 1: Check all users in the users collection
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`📋 Found ${usersSnapshot.size} users in 'users' collection`);
    
    let fixedCount = 0;
    let issuesFound = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n🔍 Checking user: ${userId}`);
      console.log(`   - Email: ${userData.email}`);
      console.log(`   - Current rewardPoints: ${userData.rewardPoints || 0}`);
      
      // Check if rewardPoints field exists
      if (userData.rewardPoints === undefined || userData.rewardPoints === null) {
        console.log(`   ⚠️  Missing rewardPoints field`);
        issuesFound++;
        
        // Initialize with default 50 points
        await updateDoc(userDoc.ref, {
          rewardPoints: 50,
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Fixed: Added 50 rewardPoints`);
        fixedCount++;
      }
      
      // Check corresponding userProfiles collection
      const profileRef = doc(db, 'userProfiles', userId);
      const profileDoc = await getDoc(profileRef);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log(`   - Profile rewardPoints: ${profileData.rewardPoints || 0}`);
        
        // Sync the points if they're different
        if ((userData.rewardPoints || 0) !== (profileData.rewardPoints || 0)) {
          console.log(`   ⚠️  Points mismatch between collections`);
          issuesFound++;
          
          await updateDoc(profileRef, {
            rewardPoints: userData.rewardPoints || 50,
            updatedAt: new Date()
          });
          
          console.log(`   ✅ Fixed: Synced profile rewardPoints`);
          fixedCount++;
        }
      } else {
        console.log(`   ⚠️  No profile found in userProfiles collection`);
        issuesFound++;
        
        // Create profile document
        await updateDoc(profileRef, {
          uid: userId,
          email: userData.email,
          displayName: userData.displayName || userData.email,
          rewardPoints: userData.rewardPoints || 50,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        console.log(`   ✅ Fixed: Created profile document`);
        fixedCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Total users checked: ${usersSnapshot.size}`);
    console.log(`   - Issues found: ${issuesFound}`);
    console.log(`   - Issues fixed: ${fixedCount}`);
    
    if (issuesFound === 0) {
      console.log(`   🎉 All user profiles are correctly set up!`);
    } else {
      console.log(`   ✅ Fixed ${fixedCount} issues with user profiles`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

// Run the fix
fixUserBonusPoints();
