import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
    const { name, email, password, confirmPassword } = await request.json();
    await connectDB();
    try {
        if (!name || !email || !password || !confirmPassword) {
            return NextResponse.json({ message: "All fields are required" }, { status: 400 });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }
        if (password !== confirmPassword) {
            return NextResponse.json({ message: "Passwords do not match" }, { status: 400 });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        

        return NextResponse.json({ message: "User created successfully", user }, { status: 201 });


    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}



