import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function PATCH(request) {
  try {
    await connectDB();

    const { userId, name, email, password, role, status } = await request.json();

    // Validate the input
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required field: userId" },
        { status: 400 }
      );
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if(role){
      user.role = role;
    }

    if(status){
      user.status= status
    }

    // Update user fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Save the updated user
    await user.save();

    // Return the updated user (excluding sensitive data like password)
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}