import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import Package from "@/lib/models/package"; // Import your Package model
import connectDB from "@/lib/mongodb";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Simple auth verification function
async function verifyToken(request) {
    const authHeader = request.headers.get('authorization');
   
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { error: "No token provided", status: 401 };
    }
    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return { user: decoded };
    } catch (error) {
        return { error: "Invalid or expired token", status: 401 };
    }
}

export async function GET(request) {
    try {
        // Connect to database
        await connectDB();
       
        // Get query parameters for pagination and filtering
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const status = searchParams.get('status');
        const role = searchParams.get('role');
        const search = searchParams.get('search');

        // Build filter object
        const filter = {};
        if (status) filter.status = status;
        if (role) filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate skip value for pagination
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const totalUsers = await User.countDocuments(filter);

        // Fetch users with pagination using aggregation to include package details
        const users = await User.aggregate([
            // Match the filter criteria
            { $match: filter },
            
            // Add package information using lookup
            {
                $lookup: {
                    from: 'packages', // Collection name (usually pluralized)
                    let: { userId: { $toString: '$_id' } }, // Convert ObjectId to string for comparison
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$UserId', { $toObjectId: '$$userId' }] // Convert back to ObjectId for matching
                                }
                            }
                        },
                        // Sort by createdAt to get the latest package if multiple exist
                        { $sort: { createdAt: -1 } },
                        // Limit to 1 package per user (get the most recent one)
                        { $limit: 1 }
                    ],
                    as: 'packageDetails'
                }
            },
            
            // Flatten the package array (since we're only getting 1 package)
            {
                $addFields: {
                    package: {
                        $cond: {
                            if: { $gt: [{ $size: '$packageDetails' }, 0] },
                            then: { $arrayElemAt: ['$packageDetails', 0] },
                            else: null
                        }
                    }
                }
            },
            
            // Remove the temporary packageDetails field and password
            {
                $project: {
                    password: 0,
                    packageDetails: 0
                }
            },
            
            // Sort by createdAt descending
            { $sort: { createdAt: -1 } },
            
            // Apply pagination
            { $skip: skip },
            { $limit: limit }
        ]);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalUsers / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return NextResponse.json({
            success: true,
            data: {
                users,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalUsers,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Get users error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}