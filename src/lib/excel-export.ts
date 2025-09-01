
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { ProcessedInvoice } from '@/types/invoice';
import { format } from 'date-fns';
import { parseDate as parseDateForSort } from '@/app/page'; // Use the same robust parser

// Helper function to parse amounts, handling 'N/A' and currency symbols/commas
const parseAmount = (amountStr: string | undefined): number | string => {
  if (!amountStr || amountStr.toLowerCase() === 'n/a' || amountStr.trim() === '') {
    return 'N/A'; // Return 'N/A' string for Excel if it's truly not available
  }
  // Remove common currency symbols ($, €, £, AED), spaces, and commas
  const cleanedAmount = amountStr.replace(/[$,€£\s,AED]/gi, '');
  const parsed = parseFloat(cleanedAmount);
  return isNaN(parsed) ? 'N/A' : parsed; // Return 'N/A' if parsing fails, otherwise the number
};

const formatDateForExcel = (dateStr: string | undefined): string => {
  if (!dateStr || dateStr.toLowerCase() === 'n/a') {
    return 'N/A';
  }
  const parsedDate = parseDateForSort(dateStr); // Use the robust parser from page.tsx
  if (parsedDate) {
    try {
      return format(parsedDate, 'dd/MM/yyyy');
    } catch (e) {
      // If formatting fails, return original string (could be an already formatted but non-standard date)
      return dateStr;
    }
  }
  return dateStr; // Fallback to original string if parsing fails
};


// New function to generate the blob
export function generateExcelBlob(invoices: ProcessedInvoice[]): Blob {
  const dataToExport = invoices
    .filter(invoice => invoice.status === 'completed' && invoice.extractedData)
    .map(invoice => ({
      'Filename': invoice.fileName,
      'Invoice Date': formatDateForExcel(invoice.extractedData!.invoice_date),
      'Invoice No.': invoice.extractedData!.invoice_number || 'N/A',
      'TRN Number': invoice.extractedData!.trn_number || 'N/A',
      'Vendor Name': invoice.extractedData!.vendor_name || 'N/A',
      'Total Before Tax': parseAmount(invoice.extractedData!.total_before_tax),
      'VAT Amount': parseAmount(invoice.extractedData!.vat_amount),
      'Total Amount': parseAmount(invoice.extractedData!.total_amount),
    }));

  if (dataToExport.length === 0) {
    return new Blob([]); // Return empty blob if no data
  }

  let grandTotalAmount = 0;
  let grandVatAmount = 0;

  dataToExport.forEach(item => {
    if (typeof item['Total Amount'] === 'number') {
      grandTotalAmount += item['Total Amount'];
    }
    if (typeof item['VAT Amount'] === 'number') {
      grandVatAmount += item['VAT Amount'];
    }
  });

  const totalsRow = {
    'Filename': '',
    'Invoice Date': '',
    'Invoice No.': '',
    'TRN Number': '',
    'Vendor Name': 'Grand Totals:',
    'Total Before Tax': '',
    'VAT Amount': grandVatAmount,
    'Total Amount': grandTotalAmount,
  };

  const sheetData = [...dataToExport, {}, totalsRow];
  const worksheet = XLSX.utils.json_to_sheet(sheetData);

  // Freeze the header row (Row 1 in Excel means 1 row from the top is frozen)
  worksheet['!freeze'] = { ySplit: 1 };

  // Style the header row
  const headerCellStyle = {
    fill: { fgColor: { rgb: "FFD9EAD3" } }, // ARGB for Light Green
    font: { bold: true },
  };

  const headerKeys = [
    'Filename', 'Invoice Date', 'Invoice No.', 'TRN Number',
    'Vendor Name', 'Total Before Tax', 'VAT Amount', 'Total Amount'
  ];

  headerKeys.forEach((key, index) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: index }); // r:0 is the first row
    if (worksheet[cellAddress]) { // Cell object should exist from json_to_sheet
      worksheet[cellAddress].s = headerCellStyle;
    } else {
      // Defensive coding: If json_to_sheet didn't create the cell (unlikely for headers),
      // create it now with value, type, and style.
      worksheet[cellAddress] = { v: key, t: 's', s: headerCellStyle };
    }
  });

  // Define number formats
  const currencyFormat = '#,##0.00;[Red]-#,##0.00;"N/A"';
  const naFormat = '"N/A"'; // Text format for "N/A"

  // Apply formatting to data rows
  // Columns for amounts: Invoice No.(2), Total Before Tax(5), VAT Amount(6), Total Amount(7) (0-indexed)
  const amountColumnIndices = [5, 6, 7]; // Indices for Total Before Tax, VAT Amount, Total Amount

  dataToExport.forEach((_row, rowIndex) => {
    const sheetRowIndex = rowIndex + 1; // Data rows start at sheet row 1 (0-indexed after header)

    // Format amount columns
    amountColumnIndices.forEach(colIndex => {
      const cellRef = XLSX.utils.encode_cell({ r: sheetRowIndex, c: colIndex });
      if (worksheet[cellRef]) {
        if (typeof worksheet[cellRef].v === 'number') {
          worksheet[cellRef].t = 'n'; // Set type to number
          worksheet[cellRef].z = currencyFormat; // Apply currency format
        } else if (worksheet[cellRef].v === 'N/A') {
          worksheet[cellRef].t = 's'; // Set type to string
          worksheet[cellRef].z = naFormat; // Apply "N/A" text format
        }
      }
    });

    // Ensure 'Invoice No.' (column C, index 2) is treated as text
    const invoiceNoCellRef = XLSX.utils.encode_cell({ r: sheetRowIndex, c: 2 });
    if (worksheet[invoiceNoCellRef]) {
      if (worksheet[invoiceNoCellRef].v !== null && worksheet[invoiceNoCellRef].v !== undefined && worksheet[invoiceNoCellRef].v !== 'N/A') {
        worksheet[invoiceNoCellRef].t = 's'; // Force to string type
        worksheet[invoiceNoCellRef].v = String(worksheet[invoiceNoCellRef].v); // Ensure value is explicitly string
      } else if (worksheet[invoiceNoCellRef].v === 'N/A') {
        worksheet[invoiceNoCellRef].t = 's'; // Keep as string if "N/A"
      }
    }
  });

  // Format the totals row
  const totalsSheetRowIndex = dataToExport.length + 2; // After data and one blank row
  const grandVatAmountCellRef = XLSX.utils.encode_cell({ r: totalsSheetRowIndex, c: 6 });
  const grandTotalAmountCellRef = XLSX.utils.encode_cell({ r: totalsSheetRowIndex, c: 7 });

  if (worksheet[grandVatAmountCellRef] && typeof worksheet[grandVatAmountCellRef].v === 'number') {
    worksheet[grandVatAmountCellRef].t = 'n';
    worksheet[grandVatAmountCellRef].z = currencyFormat;
  }
  if (worksheet[grandTotalAmountCellRef] && typeof worksheet[grandTotalAmountCellRef].v === 'number') {
    worksheet[grandTotalAmountCellRef].t = 'n';
    worksheet[grandTotalAmountCellRef].z = currencyFormat;
  }

  // Set column widths
  const columnWidths = [
    { wch: 30 }, // Filename
    { wch: 15 }, // Invoice Date
    { wch: 18 }, // Invoice No.
    { wch: 20 }, // TRN Number
    { wch: 30 }, // Vendor Name
    { wch: 18 }, // Total Before Tax
    { wch: 15 }, // VAT Amount
    { wch: 15 }, // Total Amount
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
}


export function exportToExcel(invoices: ProcessedInvoice[], fileName: string = 'invoice_data.xlsx'): void {
  const dataBlob = generateExcelBlob(invoices);
  if (dataBlob.size === 0) {
    console.warn('No data to export for direct download.');
    // Optionally, inform the user via a toast message here
    return;
  }
  saveAs(dataBlob, fileName);
}
