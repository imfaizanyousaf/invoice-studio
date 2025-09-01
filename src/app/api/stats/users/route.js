import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";

export async function GET(request) {
    try {
        await connectDB();

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days

        const daysBack = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);

        // Total users
        const totalUsers = await User.countDocuments();

        // Users by status
        const usersByStatus = await User.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // Users by role
        const usersByRole = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        // Users by provider
        const usersByProvider = await User.aggregate([
            { $group: { _id: "$provider", count: { $sum: 1 } } }
        ]);

        // User growth over time (daily for the period)
        const userGrowth = await User.aggregate([
            {
                $match: { createdAt: { $gte: startDate } }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            },
            {
                $project: {
                    date: {
                        $dateFromParts: {
                            year: "$_id.year",
                            month: "$_id.month",
                            day: "$_id.day"
                        }
                    },
                    count: 1,
                    _id: 0
                }
            }
        ]);

        // Recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const recentUsers = await User.find(
            { createdAt: { $gte: sevenDaysAgo } },
            { name: 1, email: 1, role: 1, status: 1, createdAt: 1 }
        ).sort({ createdAt: -1 }).limit(10);

        // Active vs inactive users (based on status)
        const activeUsers = await User.countDocuments({ status: "active" });
        const inactiveUsers = totalUsers - activeUsers;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    activeUsers,
                    inactiveUsers,
                    period: `${daysBack} days`
                },
                breakdown: {
                    byStatus: usersByStatus.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    byRole: usersByRole.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    byProvider: usersByProvider.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                growth: userGrowth.map(item => ({
                    date: item.date.toISOString().split('T')[0],
                    count: item.count
                })),
                recentUsers: recentUsers.map(user => ({
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    joinedDate: user.createdAt.toISOString().split('T')[0]
                }))
            }
        }, { status: 200 });

    } catch (error) {
        console.error("User stats error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}
