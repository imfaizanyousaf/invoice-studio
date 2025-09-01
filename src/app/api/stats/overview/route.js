import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Package from "@/lib/models/package";
import ExtractedInvoice from "@/lib/models/ExtractedInvoice";

export async function GET(request) {
    try {
        await connectDB();

        // Get basic counts
        const [totalUsers, totalPackages, totalInvoices] = await Promise.all([
            User.countDocuments(),
            Package.countDocuments(),
            ExtractedInvoice.countDocuments()
        ]);

        // User status breakdown
        const usersByStatus = await User.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // User role breakdown
        const usersByRole = await User.aggregate([
            { $group: { _id: "$role", count: { $sum: 1 } } }
        ]);

        // Total package value and requests
        const packageStats = await Package.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$price" },
                    totalRequests: { $sum: "$requests" },
                    avgPrice: { $avg: "$price" }
                }
            }
        ]);

        // Invoice totals
        const invoiceStats = await ExtractedInvoice.aggregate([
            {
                $addFields: {
                    totalAmountNum: {
                        $convert: {
                            input: "$total_amount",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    },
                    vatAmountNum: {
                        $convert: {
                            input: "$vat_amount",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$totalAmountNum" },
                    totalVAT: { $sum: "$vatAmountNum" },
                    avgInvoice: { $avg: "$totalAmountNum" }
                }
            }
        ]);

        // Recent activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [recentUsers, recentPackages, recentInvoices] = await Promise.all([
            User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            Package.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
            ExtractedInvoice.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
        ]);

        return NextResponse.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalPackages,
                    totalInvoices
                },
                users: {
                    byStatus: usersByStatus.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {}),
                    byRole: usersByRole.reduce((acc, item) => {
                        acc[item._id] = item.count;
                        return acc;
                    }, {})
                },
                packages: {
                    totalValue: packageStats[0]?.totalValue || 0,
                    totalRequests: packageStats[0]?.totalRequests || 0,
                    averagePrice: packageStats[0]?.avgPrice || 0
                },
                invoices: {
                    totalAmount: invoiceStats[0]?.totalAmount || 0,
                    totalVAT: invoiceStats[0]?.totalVAT || 0,
                    averageInvoice: invoiceStats[0]?.avgInvoice || 0
                },
                recentActivity: {
                    newUsers: recentUsers,
                    newPackages: recentPackages,
                    newInvoices: recentInvoices
                }
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Stats overview error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}
