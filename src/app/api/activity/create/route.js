import connectDB from "@/lib/mongodb";
import Activity from "@/lib/models/Activity";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();
    const { userId, activityEntry } = body;

    if (!userId || !activityEntry) {
      return NextResponse.json(
        { error: "userId and activityEntry are required" },
        { status: 400 }
      );
    }

    if (!activityEntry.id || !activityEntry.label || !activityEntry.timestamp) {
      return NextResponse.json(
        { error: "activityEntry must have id, label, and timestamp" },
        { status: 400 }
      );
    }

    const newActivity = await Activity.create({
      userId,
      label: activityEntry.label,
      timestamp: activityEntry.timestamp,
      excelFileDataUri: activityEntry.excelFileDataUri,
    });

    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
