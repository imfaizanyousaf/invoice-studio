import { ActivityService } from "@/services/activityService";
import connectDB from '@/lib/mongodb';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        await connectDB();

        const { userId, limit, startDate, endDate } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        let activities;

        if (startDate && endDate) {
            // Get activities for date range
            activities = await ActivityService.getUserActivitiesByDateRange(
                userId,
                startDate,
                endDate
            );
        } else {
            // Get recent activities
            const limitNum = limit ? parseInt(limit) : 30;
            activities = await ActivityService.getUserActivities(userId, limitNum);
        }

        res.status(200).json({
            success: true,
            data: activities
        });
    } catch (error) {
        console.error('Error in get activities API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}