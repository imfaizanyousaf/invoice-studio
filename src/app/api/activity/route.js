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

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const activities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit);

    return NextResponse.json(activities, { status: 200 });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: `"Failed to fetch activities:" ${error}` },
      { status: 500 }
    );
  }
}
