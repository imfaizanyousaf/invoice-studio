import { NextResponse } from "next/server";
import Plan from "@/lib/models/Plans";
import connectDB from "@/lib/mongodb";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();

    const id = await params.id;

    const updatedFields = await request.json();
    const updatedPlan = await Plan.findByIdAndUpdate(
      id,
      updatedFields,
      { new: true }
    );

    if (!updatedPlan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }



    return NextResponse.json(
      { message: "Plan updated successfully", plan: updatedPlan },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
