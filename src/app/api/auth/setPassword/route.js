import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import connectDB from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { success: false, message: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters long" },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify and decode the invitation token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Check if token is for invitation
        if (decoded.type !== "invitation") {
            return NextResponse.json(
                { success: false, message: "Invalid token type" },
                { status: 401 }
            );
        }

        // Find the user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is in invited status
        if (user.status !== "invited") {
            return NextResponse.json(
                { success: false, message: "User has already set password or is not in invited status" },
                { status: 400 }
            );
        }

        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user with password and change status to active
        user.password = hashedPassword;
        user.status = "active";
        await user.save();

        // Generate new login token
        const loginToken = jwt.sign(
            { 
                userId: user._id, 
                email: user.email, 
                name: user.name,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: "24h" }
        );

        return NextResponse.json({
            success: true,
            message: "Password set successfully. You are now logged in.",
            token: loginToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Set password error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}

// GET endpoint to verify token without setting password
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Token is required" },
                { status: 400 }
            );
        }

        await connectDB();

        // Verify and decode the invitation token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return NextResponse.json(
                { success: false, message: "Invalid or expired token" },
                { status: 401 }
            );
        }

        // Check if token is for invitation
        if (decoded.type !== "invitation") {
            return NextResponse.json(
                { success: false, message: "Invalid token type" },
                { status: 401 }
            );
        }

        // Find the user
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        // Check if user is in invited status
        if (user.status !== "invited") {
            return NextResponse.json(
                { success: false, message: "Token has already been used or user is not in invited status" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Token is valid",
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Token verification error:", error);
        return NextResponse.json(
            { success: false, message: "Server error. Please try again later." },
            { status: 500 }
        );
    }
}