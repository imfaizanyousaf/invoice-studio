// hooks/use-local-storage-invoices.ts
import { useEffect, useCallback } from 'react';
import type { ProcessedInvoice } from '@/types/invoice';
import {
  saveInvoicesToLocalStorage,
  loadInvoicesFromLocalStorage,
  clearLocalStorageInvoices,
  getStorageInfo,
  isLocalStorageAvailable,
  cleanupOldInvoices,
} from '@/lib/local-storage';

interface UseLocalStorageInvoicesReturn {
  loadStoredInvoices: () => ProcessedInvoice[];
  saveInvoices: (invoices: ProcessedInvoice[]) => void;
  clearStoredInvoices: () => void;
  getStorageInfo: () => { count: number; sizeKB: number };
  isStorageAvailable: boolean;
}

export const useLocalStorageInvoices = (): UseLocalStorageInvoicesReturn => {
  const isStorageAvailable = isLocalStorageAvailable();

  // Cleanup old invoices on mount
  useEffect(() => {
    if (isStorageAvailable) {
      cleanupOldInvoices(100); // Keep max 100 invoices
    }
  }, [isStorageAvailable]);

  const loadStoredInvoices = useCallback((): ProcessedInvoice[] => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available');
      return [];
    }
    return loadInvoicesFromLocalStorage();
  }, [isStorageAvailable]);

  const saveInvoices = useCallback((invoices: ProcessedInvoice[]) => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available, cannot save invoices');
      return;
    }
    saveInvoicesToLocalStorage(invoices);
  }, [isStorageAvailable]);

  const clearStoredInvoices = useCallback(() => {
    if (!isStorageAvailable) {
      console.warn('localStorage is not available');
      return;
    }
    clearLocalStorageInvoices();
  }, [isStorageAvailable]);

  return {
    loadStoredInvoices,
    saveInvoices,
    clearStoredInvoices,
    getStorageInfo,
    isStorageAvailable,
  };
};