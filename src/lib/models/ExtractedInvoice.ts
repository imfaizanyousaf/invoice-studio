// models/ExtractedInvoice.js

import mongoose from "mongoose";

const ExtractedInvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invoice_date: { type: String },  // Original format from AI
  invoice_number: { type: String },
  trn_number: { type: String },
  vendor_name: { type: String },
  total_before_tax: { type: String },
  vat_amount: { type: String },
  total_amount: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ExtractedInvoice = mongoose.models.ExtractedInvoice ||
  mongoose.model("ExtractedInvoice", ExtractedInvoiceSchema);



export default ExtractedInvoice;
