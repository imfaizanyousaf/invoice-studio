import connectDB from "@/lib/mongodb";
import Activity from "@/lib/models/Activity";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    try {
        await connectDB();

        const { id } = params;
        const body = await request.json();

        if (!id) {
            return NextResponse.json(
                { error: "Activity ID is required" },
                { status: 400 }
            );
        }

        const { label, timestamp, excelFileDataUri } = body;

        if (!label && !timestamp && !excelFileDataUri) {
            return NextResponse.json(
                { error: "At least one field must be provided to update" },
                { status: 400 }
            );
        }

        const updatedActivity = await Activity.findByIdAndUpdate(
            id,
            {
                ...(label && { label }),
                ...(timestamp && { timestamp }),
                ...(excelFileDataUri && { excelFileDataUri }),
            },
            { new: true } // return updated document
        );

        if (!updatedActivity) {
            return NextResponse.json(
                { error: "Activity not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(updatedActivity, { status: 200 });
    } catch (error) {
        console.error("Error updating activity:", error);
        return NextResponse.json(
            { error: "Failed to update activity" },
            { status: 500 }
        );
    }
}
