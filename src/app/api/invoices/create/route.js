import connectDB from "@/lib/mongodb";
import ExtractedInvoice from "@/lib/models/ExtractedInvoice";
import Package from "@/lib/models/package";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connectDB();

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.invoice_date || !body.invoice_number) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a new extracted invoice
    const newInvoice = await ExtractedInvoice.create({
      userId: body.userId,
      invoice_date: body.invoice_date,
      invoice_number: body.invoice_number,
      trn_number: body.trn_number,
      vendor_name: body.vendor_name,
      total_before_tax: body.total_before_tax,
      vat_amount: body.vat_amount,
      total_amount: body.total_amount,
    });


    // update package requests
    // const userPackage = await Package.findOne({ UserId: body.userId });
    // userPackage.requests -= 1;
    // await userPackage.save();
    // console.log('userPackage', userPackage);

    return NextResponse.json(newInvoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
