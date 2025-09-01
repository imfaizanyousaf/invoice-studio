import { NextResponse } from "next/server";
import Plan from "@/lib/models/Plans";
import connectDB from "@/lib/mongodb";

export const POST = async (request: Request) => {
  try {
    await connectDB();

    const body = await request.json();

    // example creation (you can update according to your payload)
    const newPlan = await Plan.create(body);

    return NextResponse.json(newPlan, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
};
