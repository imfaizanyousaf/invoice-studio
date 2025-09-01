import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import connectDB from "@/lib/mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ADMIN_EMAILS } from "@/lib/constants";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });
    }

    // ✅ Sign JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name,
        role: user.role, // ✅ inject role
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ✅ Set HttpOnly cookie so middleware/server can read it
    const res = NextResponse.json({
      success: true,
      message: "Login successful",
      token, // 👈 return as well so client can decode and set state
    });

    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Server error. Please try again later." }, { status: 500 });
  }
}
