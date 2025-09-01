
// This defines the structure of data for a SINGLE extracted invoice.
// It should align with the `SingleInvoiceDataZodSchema` in the AI flow `extract-invoice-data.ts`.
export interface SingleInvoiceExtractOutput {
  trn_number?: string;
  invoice_date?: string; 
  vendor_name?: string;
  invoice_number?: string;
  total_before_tax?: string;
  vat_amount?: string;
  total_amount?: string;
}

export interface ProcessedInvoice {
  id: string; // Unique ID for React keys
  file: File; // The original file object (can be shared if multiple invoices from one PDF)
  fileName: string; // May include page/invoice number suffix (e.g., "invoice.pdf (Invoice 1)")
  fileSize: number; // in bytes (size of the original uploaded file)
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  extractedData?: SingleInvoiceExtractOutput; // Data for ONE invoice from the (potentially multi-invoice) file
  errorMessage?: string;
  processingOrderIndex?: number; // Index to maintain original processing order
}

