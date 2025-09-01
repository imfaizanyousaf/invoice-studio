// lib/local-storage.ts
import type { ProcessedInvoice } from '@/types/invoice';

const INVOICE_STORAGE_KEY = 'invoice_insights_invoices';

export interface StoredInvoice {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'completed';
  extractedData: {
    invoice_date?: string;
    invoice_number?: string;
    trn_number?: string;
    vendor_name?: string;
    total_before_tax?: string;
    vat_amount?: string;
    total_amount?: string;
  };
  processingOrderIndex: number;
  timestamp: number; // When it was stored
}

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Save invoices to localStorage
 */
export const saveInvoicesToLocalStorage = (invoices: ProcessedInvoice[]): void => {
  if (!isBrowser) return;

  try {
    // Only save completed invoices with extracted data
    const invoicesToStore: StoredInvoice[] = invoices
      .filter(inv => inv.status === 'completed' && inv.extractedData && !inv.id.startsWith('db_'))
      .map(inv => ({
        id: inv.id,
        fileName: inv.fileName,
        fileSize: inv.fileSize,
        fileType: inv.fileType,
        status: inv.status as 'completed',
        extractedData: inv.extractedData!,
        processingOrderIndex: inv.processingOrderIndex || 0,
        timestamp: Date.now(),
      }));

    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(invoicesToStore));
    console.log(`Saved ${invoicesToStore.length} invoices to localStorage`);
  } catch (error) {
    console.error('Failed to save invoices to localStorage:', error);
  }
};

/**
 * Load invoices from localStorage
 */
export const loadInvoicesFromLocalStorage = (): ProcessedInvoice[] => {
  if (!isBrowser) return [];

  try {
    const stored = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!stored) return [];

    const storedInvoices: StoredInvoice[] = JSON.parse(stored);
    
    // Convert stored invoices back to ProcessedInvoice format
    return storedInvoices.map((storedInv): ProcessedInvoice => ({
      id: `local_${storedInv.id}`,
      file: null as any, // No file object for localStorage records
      fileName: `${storedInv.fileName} (Saved)`,
      fileSize: storedInv.fileSize,
      fileType: storedInv.fileType,
      status: 'completed',
      extractedData: storedInv.extractedData,
      processingOrderIndex: storedInv.processingOrderIndex,
    }));
  } catch (error) {
    console.error('Failed to load invoices from localStorage:', error);
    return [];
  }
};

/**
 * Clear all invoices from localStorage
 */
export const clearLocalStorageInvoices = (): void => {
  if (!isBrowser) return;

  try {
    localStorage.removeItem(INVOICE_STORAGE_KEY);
    console.log('Cleared invoices from localStorage');
  } catch (error) {
    console.error('Failed to clear invoices from localStorage:', error);
  }
};

/**
 * Get storage usage info
 */
export const getStorageInfo = (): { count: number; sizeKB: number } => {
  if (!isBrowser) return { count: 0, sizeKB: 0 };

  try {
    const stored = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!stored) return { count: 0, sizeKB: 0 };

    const storedInvoices: StoredInvoice[] = JSON.parse(stored);
    const sizeKB = new Blob([stored]).size / 1024;

    return {
      count: storedInvoices.length,
      sizeKB: Math.round(sizeKB * 100) / 100,
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return { count: 0, sizeKB: 0 };
  }
};

/**
 * Check if localStorage is available and has space
 */
export const isLocalStorageAvailable = (): boolean => {
  if (!isBrowser) return false;

  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, 'test');
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Remove old invoices if storage gets too large
 * Keeps the most recent invoices up to maxCount
 */
export const cleanupOldInvoices = (maxCount: number = 100): void => {
  if (!isBrowser) return;

  try {
    const stored = localStorage.getItem(INVOICE_STORAGE_KEY);
    if (!stored) return;

    const storedInvoices: StoredInvoice[] = JSON.parse(stored);
    
    if (storedInvoices.length <= maxCount) return;

    // Sort by timestamp (newest first) and keep only maxCount
    const sortedInvoices = storedInvoices
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxCount);

    localStorage.setItem(INVOICE_STORAGE_KEY, JSON.stringify(sortedInvoices));
    console.log(`Cleaned up localStorage: kept ${sortedInvoices.length} most recent invoices`);
  } catch (error) {
    console.error('Failed to cleanup old invoices:', error);
  }
};