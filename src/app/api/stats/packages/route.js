import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Package from "@/lib/models/package";
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

        // Total packages
        const totalPackages = await Package.countDocuments();

        // Package totals
        const packageTotals = await Package.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$price" },
                    totalRequests: { $sum: "$requests" },
                    avgPrice: { $avg: "$price" },
                    avgRequests: { $avg: "$requests" },
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" }
                }
            }
        ]);

        // Packages by price range
        const packagesByPriceRange = await Package.aggregate([
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 100, 500, 1000, 5000],
                    default: "5000+",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        // Packages by request range
        const packagesByRequestRange = await Package.aggregate([
            {
                $bucket: {
                    groupBy: "$requests",
                    boundaries: [0, 10, 50, 100, 500],
                    default: "500+",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        // Package creation over time
        const packageGrowth = await Package.aggregate([
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
                    count: { $sum: 1 },
                    totalValue: { $sum: "$price" }
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
                    totalValue: 1,
                    _id: 0
                }
            }
        ]);

        // Top packages by price
        const topPackagesByPrice = await Package.find()
            .sort({ price: -1 })
            .limit(5)
            .populate('UserId', 'name email')
            .select('name price requests UserId createdAt');

        // Top packages by requests
        const topPackagesByRequests = await Package.find()
            .sort({ requests: -1 })
            .limit(5)
            .populate('UserId', 'name email')
            .select('name price requests UserId createdAt');

        // Users with most packages
        const userPackageCounts = await Package.aggregate([
            {
                $group: {
                    _id: "$UserId",
                    packageCount: { $sum: 1 },
                    totalValue: { $sum: "$price" },
                    totalRequests: { $sum: "$requests" }
                }
            },
            { $sort: { packageCount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            {
                $project: {
                    userId: "$_id",
                    packageCount: 1,
                    totalValue: 1,
                    totalRequests: 1,
                    userName: { $arrayElemAt: ["$user.name", 0] },
                    userEmail: { $arrayElemAt: ["$user.email", 0] }
                }
            }
        ]);

        const stats = packageTotals[0] || {
            totalValue: 0,
            totalRequests: 0,
            avgPrice: 0,
            avgRequests: 0,
            minPrice: 0,
            maxPrice: 0
        };

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalPackages,
                    totalValue: stats.totalValue,
                    totalRequests: stats.totalRequests,
                    averagePrice: Math.round(stats.avgPrice * 100) / 100,
                    averageRequests: Math.round(stats.avgRequests * 100) / 100,
                    priceRange: {
                        min: stats.minPrice,
                        max: stats.maxPrice
                    },
                    period: `${daysBack} days`
                },
                distribution: {
                    byPriceRange: packagesByPriceRange.map(item => ({
                        range: item._id === "5000+" ? "5000+" : `${item._id}-${item._id === 0 ? 99 : item._id === 100 ? 499 : item._id === 500 ? 999 : 4999}`,
                        count: item.count
                    })),
                    byRequestRange: packagesByRequestRange.map(item => ({
                        range: item._id === "500+" ? "500+" : `${item._id}-${item._id === 0 ? 9 : item._id === 10 ? 49 : item._id === 50 ? 99 : 499}`,
                        count: item.count
                    }))
                },
                growth: packageGrowth.map(item => ({
                    date: item.date.toISOString().split('T')[0],
                    count: item.count,
                    totalValue: item.totalValue
                })),
                topPackages: {
                    byPrice: topPackagesByPrice.map(pkg => ({
                        id: pkg._id,
                        name: pkg.name,
                        price: pkg.price,
                        requests: pkg.requests,
                        owner: pkg.UserId ? {
                            name: pkg.UserId.name,
                            email: pkg.UserId.email
                        } : null,
                        createdAt: pkg.createdAt.toISOString().split('T')[0]
                    })),
                    byRequests: topPackagesByRequests.map(pkg => ({
                        id: pkg._id,
                        name: pkg.name,
                        price: pkg.price,
                        requests: pkg.requests,
                        owner: pkg.UserId ? {
                            name: pkg.UserId.name,
                            email: pkg.UserId.email
                        } : null,
                        createdAt: pkg.createdAt.toISOString().split('T')[0]
                    }))
                },
                topUsers: userPackageCounts.map(item => ({
                    userId: item.userId,
                    name: item.userName,
                    email: item.userEmail,
                    packageCount: item.packageCount,
                    totalValue: item.totalValue,
                    totalRequests: item.totalRequests
                }))
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Package stats error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}
