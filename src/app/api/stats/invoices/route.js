import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ExtractedInvoice from "@/lib/models/ExtractedInvoice";
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

        // Total invoices
        const totalInvoices = await ExtractedInvoice.countDocuments();

        // Invoice totals and averages
        const invoiceTotals = await ExtractedInvoice.aggregate([
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
                    },
                    subtotalNum: {
                        $convert: {
                            input: "$total_before_tax",
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
                    totalSubtotal: { $sum: "$subtotalNum" },
                    avgInvoice: { $avg: "$totalAmountNum" },
                    avgVAT: { $avg: "$vatAmountNum" },
                    minInvoice: { $min: "$totalAmountNum" },
                    maxInvoice: { $max: "$totalAmountNum" }
                }
            }
        ]);

        // Monthly invoice trends - REMOVED the date filter that was causing empty results
        const monthlyTrends = await ExtractedInvoice.aggregate([
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
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmountNum" },
                    totalVAT: { $sum: "$vatAmountNum" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                $project: {
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            { 
                                $toString: { 
                                    $cond: [
                                        { $lt: ["$_id.month", 10] },
                                        { $concat: ["0", { $toString: "$_id.month" }] },
                                        { $toString: "$_id.month" }
                                    ]
                                }
                            }
                        ]
                    },
                    count: 1,
                    totalAmount: 1,
                    totalVAT: 1,
                    _id: 0
                }
            }
        ]);

        // Top vendors by invoice count and amount
        const topVendors = await ExtractedInvoice.aggregate([
            {
                $addFields: {
                    totalAmountNum: {
                        $convert: {
                            input: "$total_amount",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$vendor_name",
                    invoiceCount: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmountNum" },
                    avgAmount: { $avg: "$totalAmountNum" }
                }
            },
            { $match: { _id: { $ne: null, $ne: "" } } },
            { $sort: { totalAmount: -1 } },
            { $limit: 10 }
        ]);

        // Invoice amount distribution
        const amountDistribution = await ExtractedInvoice.aggregate([
            {
                $addFields: {
                    totalAmountNum: {
                        $convert: {
                            input: "$total_amount",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },
            {
                $bucket: {
                    groupBy: "$totalAmountNum",
                    boundaries: [0, 500, 1000, 2500, 5000, 10000],
                    default: "10000+",
                    output: { 
                        count: { $sum: 1 },
                        totalValue: { $sum: "$totalAmountNum" }
                    }
                }
            }
        ]);

        // Users with most invoices
        const userInvoiceCounts = await ExtractedInvoice.aggregate([
            {
                $addFields: {
                    totalAmountNum: {
                        $convert: {
                            input: "$total_amount",
                            to: "double",
                            onError: 0,
                            onNull: 0
                        }
                    }
                }
            },
            {
                $group: {
                    _id: "$userId",
                    invoiceCount: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmountNum" },
                    avgAmount: { $avg: "$totalAmountNum" }
                }
            },
            { $sort: { invoiceCount: -1 } },
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
                    invoiceCount: 1,
                    totalAmount: 1,
                    avgAmount: 1,
                    userName: { $arrayElemAt: ["$user.name", 0] },
                    userEmail: { $arrayElemAt: ["$user.email", 0] }
                }
            }
        ]);

        // Recent invoices
        const recentInvoices = await ExtractedInvoice.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name email')
            .select('invoice_number vendor_name total_amount invoice_date userId createdAt');

        const stats = invoiceTotals[0] || {
            totalAmount: 0,
            totalVAT: 0,
            totalSubtotal: 0,
            avgInvoice: 0,
            avgVAT: 0,
            minInvoice: 0,
            maxInvoice: 0
        };

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    totalInvoices,
                    totalAmount: Math.round(stats.totalAmount * 100) / 100,
                    totalVAT: Math.round(stats.totalVAT * 100) / 100,
                    totalSubtotal: Math.round(stats.totalSubtotal * 100) / 100,
                    averageInvoice: Math.round(stats.avgInvoice * 100) / 100,
                    averageVAT: Math.round(stats.avgVAT * 100) / 100,
                    invoiceRange: {
                        min: Math.round(stats.minInvoice * 100) / 100,
                        max: Math.round(stats.maxInvoice * 100) / 100
                    },
                    period: `${daysBack} days`
                },
                trends: {
                    monthly: monthlyTrends.map(item => ({
                        month: item.month,
                        count: item.count,
                        totalAmount: Math.round(item.totalAmount * 100) / 100,
                        totalVAT: Math.round(item.totalVAT * 100) / 100
                    }))
                },
                distribution: {
                    byAmount: amountDistribution.map(item => {
                        let range;
                        if (item._id === "10000+") {
                            range = "10000+";
                        } else {
                            const boundaries = [0, 500, 1000, 2500, 5000, 10000];
                            const idx = boundaries.indexOf(item._id);
                            const nextBoundary = boundaries[idx + 1];
                            range = `${item._id}-${nextBoundary - 1}`;
                        }
                        return {
                            range,
                            count: item.count,
                            totalValue: Math.round(item.totalValue * 100) / 100
                        };
                    })
                },
                topVendors: topVendors.map(vendor => ({
                    name: vendor._id || "Unknown",
                    invoiceCount: vendor.invoiceCount,
                    totalAmount: Math.round(vendor.totalAmount * 100) / 100,
                    averageAmount: Math.round(vendor.avgAmount * 100) / 100
                })),
                topUsers: userInvoiceCounts.map(item => ({
                    userId: item.userId,
                    name: item.userName || "Unknown",
                    email: item.userEmail || "Unknown",
                    invoiceCount: item.invoiceCount,
                    totalAmount: Math.round(item.totalAmount * 100) / 100,
                    averageAmount: Math.round(item.avgAmount * 100) / 100
                })),
                recentInvoices: recentInvoices.map(invoice => ({
                    id: invoice._id,
                    invoiceNumber: invoice.invoice_number || "N/A",
                    vendor: invoice.vendor_name || "Unknown",
                    amount: invoice.total_amount || "0",
                    invoiceDate: invoice.invoice_date || "N/A",
                    user: invoice.userId ? {
                        name: invoice.userId.name,
                        email: invoice.userId.email
                    } : null,
                    createdAt: invoice.createdAt.toISOString().split('T')[0]
                }))
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Invoice stats error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}