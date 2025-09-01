import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import connectDB from "@/lib/mongodb";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { name, email, role = "user", password = "password" } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: "Name and email are required" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please provide a valid email" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      role,
      status: "invited",
      provider: "email",
      password: hashedPassword,
    });

    await newUser.save();

    const invitationToken = jwt.sign(
      {
        userId: newUser._id,
        email: newUser.email,
        type: "invitation",
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // 👇 automatically detect origin
    const { origin } = new URL(request.url);

    // Build full invitation link
    const invitationUrl = `${origin}/reset-password?token=${invitationToken}`;

    // Send email (same as your code…)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "You have been invited to join our platform",
      text: `Hello ${name},\n\nYou have been invited to join our platform. Please click the link below to set your password and complete your registration:\n\n${invitationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe Team`,
      html: `<div>Click <a href="${invitationUrl}">here</a> to set your password.</div>`,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User invited successfully. Invitation email sent.",
        userId: newUser._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Invitation error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
