import { NextResponse } from "next/server";
import Package from "@/lib/models/package";
import connectDB from "@/lib/mongodb";

export async function GET(request, { params }) {
    try {
        await connectDB();
        const { userId } = await params; // params comes from folder [userId]

        if (!userId) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        const latestPackage = await Package.findOne({ UserId: userId })
            .sort({ createdAt: -1 })
            .limit(1);

        if (!latestPackage) {
            const newPackage = await Package.create({
                UserId: userId,
                name: "Free",
                requests: 10,
                price: 0,
            });
            return NextResponse.json(newPackage, { status: 200 });
        }

        return NextResponse.json(latestPackage, { status: 200 });
    } catch (error) {
        console.error("Error fetching packages:", error);
        return NextResponse.json(
            { error: "Failed to fetch packages" },
            { status: 500 }
        );
    }
}
