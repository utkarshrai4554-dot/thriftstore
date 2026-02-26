import { checkAllUsersBirthdayRewards } from "@/services/userService";
import { toast } from "sonner";

// Function to run birthday reward checks (can be called by a cron job or scheduled task)
export const runBirthdayRewardChecks = async () => {
  try {
    console.log('🎂 Running automatic birthday reward checks...');
    const result = await checkAllUsersBirthdayRewards();
    
    if (result.awarded > 0) {
      console.log(`✅ Birthday rewards awarded to ${result.awarded} users out of ${result.processed} processed`);
      toast.success(`Happy Birthday to ${result.awarded} users! 🎉`);
    } else {
      console.log(`📊 Processed ${result.processed} users, no birthday rewards awarded today`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error running birthday reward checks:', error);
    toast.error('Failed to run birthday reward checks');
    throw error;
  }
};

// Function to set up daily birthday check (client-side simulation)
// In production, this should be handled by a server-side cron job
export const setupDailyBirthdayCheck = () => {
  const checkBirthdays = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    
    // Run at 9:00 AM every day
    if (hour === 9 && minute === 0) {
      runBirthdayRewardChecks();
    }
  };

  // Check every minute
  const interval = setInterval(checkBirthdays, 60000);
  
  // Also run immediately when setup is called (in case we missed the scheduled time)
  runBirthdayRewardChecks();
  
  return () => clearInterval(interval);
};

// Function to manually trigger birthday checks (for testing or admin use)
export const manuallyTriggerBirthdayChecks = async () => {
  try {
    const result = await runBirthdayRewardChecks();
    return {
      success: true,
      message: `Processed ${result.processed} users, awarded birthday rewards to ${result.awarded} users`,
      ...result
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message
    };
  }
};
