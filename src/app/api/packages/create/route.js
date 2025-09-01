import connectDB from "@/lib/mongodb";
import Package from "@/lib/models/package";
import { NextResponse } from "next/server";
// import User from '@/lib/models/User';

export async function POST(request) {
    try {
        await connectDB();

        const { UserId, name, price, requests } = await request.json();
        console.log(UserId, name, price);

        
        if (!UserId || !name || !price, !requests) {
            return NextResponse.json(
                { error: "Missing required fields: userId, name, or price" },
                { status: 400 }
            );
        }

        const pack=await Package.findOne({ UserId: UserId }).sort({ createdAt: -1 }).limit(1);
        console.log("old", pack);
        console.log("new", requests);

        if (pack) {
            pack.name = name;
            pack.requests += requests;
            await pack.save();
            return NextResponse.json(pack, { status: 201 });
        }

        
        const newPackage = new Package({
            UserId: UserId,
            name,
            requests,
            price,
        });

        await newPackage.save();

        // Return the created package
        return NextResponse.json(newPackage, { status: 201 });
    } catch (error) {
        console.error("Error creating package:", error);
        return NextResponse.json(
            { error: "Failed to create package" },
            { status: 500 }
        );
    }
}