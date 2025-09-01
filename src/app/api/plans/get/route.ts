import { NextResponse } from "next/server";
import Plan from "@/lib/models/Plans";
import connectDB from "@/lib/mongodb";

export const GET = async () => {
  try {
    await connectDB();
    const plans = await Plan.find();
    return NextResponse.json(plans, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
};
