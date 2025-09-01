import { NextResponse } from "next/server";
import Plan from "@/lib/models/Plans";
import connectDB from "@/lib/mongodb";

export const POST = async (request: Request) => {
  try {
    await connectDB();

    const body = await request.json();

    // Delete the plan by ID
    const deletedPlan = await Plan.findByIdAndDelete(body.id);

    if (!deletedPlan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(deletedPlan, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
};
