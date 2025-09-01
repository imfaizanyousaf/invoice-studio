import connectDB from "@/lib/mongodb";
import Contact from "@/lib/models/contact";
import { NextResponse } from "next/server";


export async function POST(request) {
  const { email, subject, message } = await request.json();

  if (!subject || !email || !message) {
    return NextResponse.json("Please fill in all fields", { status: 400 });
  }

  try {
    await connectDB();
    const contact = new Contact({ email, subject, message });
    await contact.save();
    return NextResponse.json("Message sent successfully", { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json("Error sending message", { status: 500 });
  }
}

