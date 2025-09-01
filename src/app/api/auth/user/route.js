import { NextResponse } from "next/server";
import jwt from "jsonwebtoken"; 
import User from "@/lib/models/User"; 
import connectDB from "@/lib/mongodb"; 

export async function POST(request) {
  await connectDB(); 
  try {
    
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.split(" ")[1]; 


    if (!token) {
      return NextResponse.json(
        { message: "Authorization token is missing" },
        { status: 401 }
      );
    }

    
    const decodedUser = jwt.verify(token, process.env.JWT_SECRET);

    
    const user = await User.findById(decodedUser.userId);

    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

   
    return NextResponse.json(
      { message: "User fetched successfully", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/user:", error);

    
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}