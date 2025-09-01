import { NextResponse } from "next/server";
import User from "@/lib/models/User";
import connectDB from "@/lib/mongodb";

export const POST = async (request: Request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Delete the plan by ID
    const deletedUser = await User.findByIdAndDelete(body.id);

    if (!deletedUser) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedUser, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
};
