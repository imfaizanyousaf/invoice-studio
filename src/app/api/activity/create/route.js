import { ActivityService } from "@/services/activityService";
import connectDB from '@/lib/mongodb'; // Your DB connection utility

export default async function handler(req, res) {
    try {
        await connectDB();

        const { userId, activityEntry } = req.body;

        if (!userId || !activityEntry) {
            return res.status(400).json({ message: 'userId and activityEntry are required' });
        }

        // Validate activityEntry structure
        if (!activityEntry.id || !activityEntry.label || !activityEntry.timestamp) {
            return res.status(400).json({
                message: 'activityEntry must have id, label, and timestamp'
            });
        }

        const result = await ActivityService.logActivity(userId, activityEntry);

        res.status(201).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in log activity API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// // pages/api/activity/stats/[userId].js - Get activity statistics
// import { ActivityService } from '../../../../src/services/activityService';
// import connectDB from '../../../../src/lib/connectDB';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     await connectDB();

//     const { userId, days } = req.query;

//     if (!userId) {
//       return res.status(400).json({ message: 'userId is required' });
//     }

//     const daysNum = days ? parseInt(days) : 30;
//     const stats = await ActivityService.getUserActivityStats(userId, daysNum);

//     res.status(200).json({
//       success: true,
//       data: stats
//     });
//   } catch (error) {
//     console.error('Error in get activity stats API:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// }

// Example usage in your components:
/*
// Log an activity
const logActivity = async (activityEntry) => {
  try {
    const response = await fetch('/api/activity/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user123', // Get from your auth system
        activityEntry
      })
    });
    const result = await response.json();
    console.log('Activity logged:', result);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Get user activities
const getUserActivities = async (userId) => {
  try {
    const response = await fetch(`/api/activity/${userId}?limit=50`);
    const result = await response.json();
    return result.data; // This matches your ActivityLog type
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};
*/