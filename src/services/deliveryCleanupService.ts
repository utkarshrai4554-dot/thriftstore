import { cleanupExpiredAssignments } from './deliveryAssignmentService';

// This service runs periodically to clean up expired assignments
class DeliveryCleanupService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  start() {
    if (this.intervalId) {
      console.log('Delivery cleanup service already running');
      return;
    }

    console.log('Starting delivery cleanup service...');
    
    // Run cleanup immediately
    this.runCleanup();
    
    // Set up periodic cleanup
    this.intervalId = setInterval(() => {
      this.runCleanup();
    }, this.CLEANUP_INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Delivery cleanup service stopped');
    }
  }

  private async runCleanup() {
    try {
      await cleanupExpiredAssignments();
    } catch (error) {
      console.error('Error in delivery cleanup:', error);
    }
  }
}

// Export singleton instance
export const deliveryCleanupService = new DeliveryCleanupService();
