// src/services/activityService.js
import ActivityLog from '@/lib/models/Activity';
import { ActivityDateGroup } from '@/types/activity';
import { ActivityEntry } from '@/types/activity';

export class ActivityService {
  
  /**
   * Log a new activity for a user
   */
  static async logActivity(userId: any, activityEntry: ActivityEntry) {
    try {
      return await ActivityLog.logActivity(userId, activityEntry);
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Get user's complete activity log
   */
  static async getUserActivities(userId: any, limit = 30) {
    try {
      return await ActivityLog.getUserActivityLog(userId, limit);
    } catch (error) {
      console.error('Error fetching user activities:', error);
      throw error;
    }
  }

  /**
   * Get activities for a specific date
   */
  static async getUserActivitiesForDate(userId: any, date: any) {
    try {
      const activity = await ActivityLog.findOne({ userId, date });
      return activity ? {
        date: activity.date,
        entries: activity.entries.sort((a: { timestamp: number; }, b: { timestamp: number; }) => b.timestamp - a.timestamp)
      } : null;
    } catch (error) {
      console.error('Error fetching activities for date:', error);
      throw error;
    }
  }

  /**
   * Get activities within a date range
   */
  static async getUserActivitiesByDateRange(userId: any, startDate: any, endDate: any) {
    try {
      const activities = await ActivityLog.getUserActivityByDateRange(userId, startDate, endDate);
      return activities.map((activity: { date: any; entries: any[]; }) => ({
        date: activity.date,
        entries: activity.entries.sort((a: { timestamp: number; }, b: { timestamp: number; }) => b.timestamp - a.timestamp)
      }));
    } catch (error) {
      console.error('Error fetching activities by date range:', error);
      throw error;
    }
  }

  /**
   * Delete all activities for a user (GDPR compliance)
   */
  static async deleteUserActivities(userId: any) {
    try {
      return await ActivityLog.deleteMany({ userId });
    } catch (error) {
      console.error('Error deleting user activities:', error);
      throw error;
    }
  }

  /**
   * Delete activities older than specified days
   */
  static async deleteOldActivities(userId: any, daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      const cutoffDateString = cutoffDate.toISOString().split('T')[0];
      
      return await ActivityLog.deleteMany({
        userId,
        date: { $lt: cutoffDateString }
      });
    } catch (error) {
      console.error('Error deleting old activities:', error);
      throw error;
    }
  }

  /**
   * Get activity statistics for a user
   */
  static async getUserActivityStats(userId: any, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateString = startDate.toISOString().split('T')[0];

      const activities = await ActivityLog.find({
        userId,
        date: { $gte: startDateString }
      });

      const totalEntries = activities.reduce((sum, activity) => sum + activity.entries.length, 0);
      const totalDaysWithActivity = activities.length;

      return {
        totalActivities: totalEntries,
        activeDays: totalDaysWithActivity,
        averagePerDay: totalDaysWithActivity > 0 ? (totalEntries / totalDaysWithActivity).toFixed(2) : 0,
        dateRange: {
          from: startDateString,
          to: new Date().toISOString().split('T')[0]
        }
      };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }
}

// Example usage functions for your API routes

/**
 * Example: Migrate from localStorage to MongoDB
 * Call this when user logs in to sync their localStorage data
 */
// export async function migrateFromLocalStorage(userId: string, localStorageActivityLog: ActivityDateGroup[]): Promise<void> {
//   try {
//     const promises = localStorageActivityLog.map(async (dateGroup) => {
//       const existingLog = await ActivityLog.findOne({ 
//         userId, 
//         date: dateGroup.date 
//       });

//       if (existingLog) {
//         // Merge entries, avoiding duplicates
//         const existingIds = new Set(existingLog.entries.map((e: { id: any; }) => e.id));
//         const newEntries = dateGroup.entries.filter(entry => !existingIds.has(entry.id));
        
//         if (newEntries.length > 0) {
//           existingLog.entries.push(...newEntries);
//           existingLog.entries.sort((a: { timestamp: number; }, b: { timestamp: number; }) => b.timestamp - a.timestamp);
//           return existingLog.save();
//         }
//       } else {
//         // Create new document
//         return ActivityLog.create({
//           userId,
//           date: dateGroup.date,
//           entries: dateGroup.entries.sort((a, b) => b.timestamp - a.timestamp)
//         });
//       }
//     });

//     await Promise.all(promises);
//     console.log(`Successfully migrated activity data for user ${userId}`);
//   } catch (error) {
//     console.error('Error migrating from localStorage:', error);
//     throw error;
//   }
// }