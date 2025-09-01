import { NextResponse } from "next/server";
import User from "@/lib/models/User";
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

        // Fetch users with pagination
        const users = await User.find(filter)
            .select('-password') // Exclude password field
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

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
