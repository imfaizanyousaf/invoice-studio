
// This is an AI-powered invoice data extraction flow.
'use server';
/**
 * @fileOverview Invoice data extraction AI agent.
 * Capable of processing multi-page documents (like PDFs) where each page might be a separate invoice.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceData function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceData function (an array of single invoice data).
 */

import {ai} from '@/ai/genkit';
import {z}from 'genkit';

// Schema for a single invoice's extracted data
const SingleInvoiceDataZodSchema = z.object({
  trn_number: z.string().optional().describe('The TRN number of the invoice. Output "N/A" if not found or illegible.'),
  invoice_date: z.string().optional().describe('The date of the invoice, preferably in YYYY-MM-DD format. Output "N/A" if not found, illegible, or confidence is below 90%.'),
  vendor_name: z.string().optional().describe('The name of the vendor. Output "N/A" if not found or illegible.'),
  invoice_number: z.string().optional().describe('The sequential invoice number (e.g., "INV-001", "12345", "SI-1002"). Look for labels like "Invoice No.", "No.", "Document No.", "Reference No.", "Bill No.". Output "N/A" if not found, not applicable, or illegible. This is particularly important for Sales Invoices.'),
  total_before_tax: z.string().optional().describe('The total amount before any taxes (e.g., Subtotal, Net Amount, Amount Before Tax). Output "N/A" if not found or illegible.'),
  vat_amount: z.string().optional().describe('The VAT amount of the invoice. Output "N/A" if not found or illegible.'),
  total_amount: z.string().optional().describe('The final, all-inclusive total amount of the invoice. Output "N/A" if not found or illegible.'),
});

// The flow's input
const ExtractInvoiceDataInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .describe(
      "A document (PDF or image) containing one or more invoices, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  invoiceType: z.enum(['purchase', 'sales']).describe('The type of invoice being processed, either "purchase" or "sales".'),
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;


// The flow's output is an ARRAY of single invoice data objects
const ExtractInvoiceDataOutputSchema = z.array(SingleInvoiceDataZodSchema)
  .describe("An array of extracted invoice data objects. Each object represents a single invoice found in the document. Returns an empty array if no invoices are found or if the document is not an invoice.");

// This type will be an array of objects matching SingleInvoiceDataZodSchema
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;


export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const extractInvoiceDataPrompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  model: 'googleai/gemini-1.5-flash', // Using gemini-1.5-flash for speed
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  prompt: `You are an expert accounting assistant with exceptional attention to detail, specializing in extracting data from invoices.
The provided document (image or PDF) may contain one or more invoices. The 'invoiceType' parameter indicates if this is a 'purchase' or 'sales' invoice context.
If it's a multi-page PDF, each page could represent a separate invoice, or a single invoice could span multiple pages. Your goal is to identify EACH distinct invoice.

Carefully and METICULOUSLY examine the entire document. Your primary goal is to extract ALL relevant information for EACH distinct invoice. Do not give up easily on a field; scan thoroughly. It is crucial that you do not miss any information that is present. If a value exists, it must be extracted. Pay close attention to documents where information might be spread across different sections or is in a non-standard format.

For each distinct invoice you identify, extract the following fields with the HIGHEST POSSIBLE ACCURACY:

- TRN number (Tax Registration Number or equivalent VAT/GST ID): This is a critical identifier. Search headers, footers, and contact information sections. It's often labeled 'TRN', 'VAT No.', 'GST ID', etc. If multiple TRNs are present (e.g., buyer and seller), prioritize the seller's TRN.
- Invoice date: The date the invoice was issued. Strive for YYYY-MM-DD format. If this format is not directly available, extract the date as it appears and then reformat it to YYYY-MM-DD. Common labels are 'Invoice Date', 'Date', 'Issue Date'. If the year is missing but contextually clear (e.g., it's the current year for a recent document), please infer and include it. ACCURACY FOR THIS FIELD IS CRITICAL. If your confidence for this field is below 90%, output "N/A".
- Vendor name: The name of the company or individual issuing the invoice. This is usually found at the top of the invoice, often associated with a logo. Extract the full legal or trading name if available. Avoid extracting the buyer's name here.
- Invoice Number (invoice_number): The sequential identifier for the invoice. Look for labels like "Invoice No.", "No.", "Document Number", "Reference Number", "Bill No.".
  - If 'invoiceType' is 'sales': This field is CRITICAL. Extract it accurately. It's a key identifier for sales documents.
  - If 'invoiceType' is 'purchase': This field is less critical but still useful. If present and clear, extract it. If not prominent or ambiguous for a purchase invoice, output "N/A".
  Always output "N/A" if not found, illegible, or if your confidence is low for any invoice type.
- Total amount before tax: This is the subtotal or net amount *before* any taxes like VAT or GST are applied. Look for labels such as 'Subtotal', 'Net Amount', 'Amount before Tax', 'Taxable Amount'. Extract the complete numerical value as a string, excluding currency symbols. For example, "AED 100.00" should be "100.00". If not found or if confidence is low, output "N/A".
- VAT amount (Value Added Tax amount or equivalent sales tax): This is the specific amount of tax. Look for labels like 'VAT', 'Sales Tax', 'GST'. If multiple tax lines are present, sum them to get a total VAT, or use a 'Total VAT' line if provided. If a percentage is given but not an amount, try to calculate it if the base amount is clear, otherwise prioritize explicitly stated VAT amounts. Extract the complete numerical value as a string, including decimal points, excluding currency symbols. If not found or if confidence is low, output "N/A".
- Total amount: This must be the FINAL, all-inclusive amount payable. It is usually the most prominent monetary value on the invoice, often labeled 'Total', 'Grand Total', 'Amount Due', or similar. Ensure it includes all taxes and subtracts any discounts. Extract the complete numerical value as a string, including decimal points, excluding currency symbols. For example, "AED 123.45" should be extracted as "123.45". If not found or if confidence is low, output "N/A".

ACCURACY IS PARAMOUNT. Double-check every piece of extracted data against the document.
You *must* return all fields defined in the output schema (trn_number, invoice_date, vendor_name, invoice_number, total_before_tax, vat_amount, total_amount) for every identified invoice.
If, and ONLY IF, a value is genuinely missing, completely illegible after an exhaustive search, or your confidence in its accuracy is low (e.g., below 90% certain, ESPECIALLY FOR INVOICE DATE), you MUST output "N/A" for that specific field within the JSON object for that invoice. Do not omit any field from the JSON structure or leave it blank if it was searched for. Do not invent data or guess values if they are truly absent or uncertain.

IMPORTANT OUTPUT FORMATTING RULES:
Your response MUST ALWAYS be a valid JSON array.
- If you successfully extract data for one or more invoices, each invoice's data should be an object in this array, adhering to the schema fields: trn_number, invoice_date, vendor_name, invoice_number, total_before_tax, vat_amount, total_amount.
- If the document contains no identifiable invoices, or if you encounter ANY error during processing (e.g., document is unreadable, internal model error, could not extract required fields with high confidence), you MUST return an empty JSON array: [].
- Do NOT return plain text error messages, explanations outside the JSON structure, or any non-JSON content. Strictly adhere to providing either an array of invoice objects or an empty array [].

Invoice Document: {{media url=invoiceDataUri}}
Invoice Type Context: {{{invoiceType}}}
`,
});

const extractInvoiceDataFlow = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlow',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async (input): Promise<ExtractInvoiceDataOutput> => {
    try {
      const {output} = await extractInvoiceDataPrompt(input);
      // If the model returns undefined or null, default to an empty array.
      // Genkit's Zod validation on the output schema will handle cases where 'output'
      // is defined but doesn't match ExtractInvoiceDataOutputSchema.
      return output || [];
    } catch (error: any) {
      // Simplified error logging to prevent logger from crashing
      let errorMessage = "Unknown error in extractInvoiceDataFlow";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      const inputHint = `invoiceType: ${input?.invoiceType}, fileNameHint (first 50 chars): ${input?.invoiceDataUri?.substring(0,50)+"..."}`;
      console.error(`extractInvoiceDataFlow Error: ${errorMessage}. Input hint: ${inputHint}`);
      
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
      // If any error occurs during the prompt execution (e.g., model unavailable, API error, network issue),
      // catch it and return an empty array to satisfy the output schema.
      // This prevents a generic "unexpected response" from propagating to the client.
      return []; 
    }
  }
);

