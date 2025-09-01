
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { InvoiceUploader } from '@/components/invoice-uploader';
import { InvoiceDataTable } from '@/components/invoice-data-table';
import { exportToExcel, generateExcelBlob } from '@/lib/excel-export';
import { blobToDataUri } from '@/lib/file-utils';
import type { ProcessedInvoice, SingleInvoiceExtractOutput } from '@/types/invoice';
import { extractInvoiceData } from '@/ai/flows/extract-invoice-data';
import { useToast } from "@/hooks/use-toast";
import { Download, ScanText, RefreshCw, Play, Touchpad, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Progress } from "@/components/ui/progress";
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { ActivitySidebarContent } from '@/components/activity-sidebar-content';
import type { ActivityLog, ActivityEntry, ActivityDateGroup } from '@/types/activity';
import { SettingsPanel } from '@/components/settings-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { useUser } from '@/context/UserContext';
import { usePackage } from '@/context/PackageContext';
import Notification from '@/components/dashboard/Notification';
import * as requestLimiter from '@/lib/request-limiter';
import { useSession } from 'next-auth/react';


export type InvoiceType = 'purchase' | 'sales';

export type SortableColumnKey = keyof Pick<SingleInvoiceExtractOutput, 'invoice_date' | 'invoice_number' | 'trn_number' | 'vendor_name' | 'total_before_tax' | 'vat_amount' | 'total_amount'> | 'processingOrder';

interface SortConfig {
  column: SortableColumnKey | null;
  direction: 'ascending' | 'descending';
}


const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Helper function to parse date strings for sorting
export const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;

  // Try YYYY-MM-DD (preferred AI output)
  let parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (parts) return new Date(Date.UTC(parseInt(parts[1]), parseInt(parts[2]) - 1, parseInt(parts[3])));

  // Try DD-MM-YYYY (e.g., 07-03-2019 for March 7th, 2019)
  parts = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (parts) return new Date(Date.UTC(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1])));

  // Try DD/MM/YYYY (e.g., 07/03/2019 for March 7th, 2019)
  parts = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (parts) return new Date(Date.UTC(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1])));

  const parsedTimestamp = Date.parse(dateStr);
  if (!isNaN(parsedTimestamp)) {
    const tempDate = new Date(parsedTimestamp);
    return new Date(Date.UTC(tempDate.getUTCFullYear(), tempDate.getUTCMonth(), tempDate.getUTCDate()));
  }

  return null;
};

const createInvoiceSignature = (data?: SingleInvoiceExtractOutput): string => {
  if (!data) {
    return `no_data_${nanoid()}`;
  }
  const normalize = (str?: string) => (str || '').toLowerCase().trim().replace(/[^a-z0-9.-]/gi, '');

  let normalizedDate = normalize(data.invoice_date);
  const parsedDateForSignature = parseDate(data.invoice_date);
  if (parsedDateForSignature) {
    const year = parsedDateForSignature.getUTCFullYear();
    const month = (parsedDateForSignature.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = parsedDateForSignature.getUTCDate().toString().padStart(2, '0');
    normalizedDate = `${year}-${month}-${day}`;
  }

  return [
    normalize(data.trn_number),
    normalizedDate,
    normalize(data.vendor_name),
    normalize(data.invoice_number),
    normalize(data.total_before_tax),
    normalize(data.vat_amount),
    normalize(data.total_amount),
  ].join('|');
};

// Helper function to send invoice data to API
const sendInvoiceToAPI = async (invoiceData: SingleInvoiceExtractOutput, userId: string) => {
  try {
    const response = await fetch('/api/invoices/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        invoice_date: invoiceData.invoice_date,
        invoice_number: invoiceData.invoice_number,
        trn_number: invoiceData.trn_number,
        vendor_name: invoiceData.vendor_name,
        total_before_tax: invoiceData.total_before_tax,
        vat_amount: invoiceData.vat_amount,
        total_amount: invoiceData.total_amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save invoice: ${response.statusText}`);
    }

    const savedInvoice = await response.json();
    console.log('Invoice saved to database:', savedInvoice);
    return savedInvoice;
  } catch (error) {
    console.error('Error saving invoice to database:', error);
    throw error;
  }
};

// Helper function to fetch user's existing invoices
const fetchUserInvoices = async (userId: string): Promise<ProcessedInvoice[]> => {
  try {
    const response = await fetch(`/api/invoices/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch invoices: ${response.statusText}`);
    }

    const invoices = await response.json();
    console.log('Fetched user invoices:', invoices);
    
    // Convert database invoices to ProcessedInvoice format
    return invoices.map((invoice: any, index: number) => ({
      id: `db_${invoice._id}`,
      file: null as any, // No file object for database records
      fileName: `Database Invoice ${index + 1}`,
      fileSize: 0,
      fileType: 'application/json',
      status: 'completed' as const,
      extractedData: {
        invoice_date: invoice.invoice_date,
        invoice_number: invoice.invoice_number,
        trn_number: invoice.trn_number,
        vendor_name: invoice.vendor_name,
        total_before_tax: invoice.total_before_tax,
        vat_amount: invoice.vat_amount,
        total_amount: invoice.total_amount,
      },
      processingOrderIndex: index, // Use index for sorting
    }));
  } catch (error) {
    console.error('Error fetching user invoices:', error);
    return [];
  }
};

// This component now needs access to sidebar state to conditionally render the trigger
function PageContent() {
  const [invoices, setInvoices] = useState<ProcessedInvoice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const { toast } = useToast();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'processingOrder', direction: 'ascending' });
  const [activityLog, setActivityLog] = useState<ActivityLog>([]);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('purchase');
  const { user } = useUser();
  const { updatePackageRequests } = usePackage();
  const [requestError, setRequestError] = useState<string | null>(null);
  const { data: session, status } = useSession();

  const { open, isMobile, openMobile } = useSidebar();
  const isSidebarActuallyOpen = isMobile ? openMobile : open;

  // Debug logging for user and session
  useEffect(() => {
    console.log("Dashboard - User context:", user);
    console.log("Dashboard - Session:", session);
    console.log("Dashboard - Session status:", status);
  }, [user, session, status]);

  // Fetch user's existing invoices when user is present
  useEffect(() => {
    const loadUserInvoices = async () => {
      // Get user ID from multiple possible sources
      let userId = null;
      
      if (user?.userId || user?._id) {
        userId = user.userId || user._id;
      } else if (session?.user && ((session.user as any)?.id || (session.user as any)?._id)) {
        userId = (session.user as any).id || (session.user as any)._id;
      }
      
      console.log("Dashboard - Loading invoices for userId:", userId);
      
      if (userId) {
        const userInvoices = await fetchUserInvoices(userId);
        if (userInvoices.length > 0) {
          setInvoices(prevInvoices => {
            // Filter out any existing database invoices to avoid duplicates
            const nonDbInvoices = prevInvoices.filter(inv => !inv.id.startsWith('db_'));
            return [...userInvoices, ...nonDbInvoices];
          });
          toast({
            title: "Invoices Loaded",
            description: `Loaded ${userInvoices.length} existing invoice(s) from your account.`,
          });
        }
      }
    };

    loadUserInvoices();
  }, [user?.userId, user?._id, session?.user?.id, session?.user?._id, toast]);


  const logActivity = useCallback((label: string, excelFileDataUri?: string) => {
    const newEntry: ActivityEntry = {
      id: nanoid(),
      label,
      timestamp: Date.now(),
      excelFileDataUri,
    };
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    setActivityLog(prevLog => {
      const todayGroupIndex = prevLog.findIndex(group => group.date === today);
      if (todayGroupIndex > -1) {
        const updatedLog = [...prevLog];
        const updatedEntries = [newEntry, ...updatedLog[todayGroupIndex].entries];
        updatedLog[todayGroupIndex] = { ...updatedLog[todayGroupIndex], entries: updatedEntries };
        return updatedLog;
      } else {
        const newGroup: ActivityDateGroup = { date: today, entries: [newEntry] };
        return [newGroup, ...prevLog];
      }
    });
  }, []);

  const handleRenameActivityEntry = useCallback((entryId: string, newLabel: string) => {
    setActivityLog(prevLog => {
      return prevLog.map(group => ({
        ...group,
        entries: group.entries.map(entry =>
          entry.id === entryId ? { ...entry, label: newLabel } : entry
        ),
      }));
    });
    toast({
      title: "Activity Renamed",
      description: `Entry updated to "${newLabel}".`,
    });
  }, [toast]);


  const handleFilesAccepted = useCallback(async (files: File[]) => {
    const newInvoices: ProcessedInvoice[] = files.map(file => ({
      id: nanoid(),
      file,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      status: 'pending',
    }));

    setInvoices(prevInvoices => [...prevInvoices, ...newInvoices]);

    if (newInvoices.length > 0) {
      toast({
        title: "Files Added",
        description: `${newInvoices.length} file(s) added to the queue. Press "Process Invoices" to start.`,
      });
    }
  }, [toast]);

  const handleProcessInvoices = useCallback(async () => {


    console.log("handleProcessInvoices start", user, session);


    const invoicesToProcess = invoices.filter(inv => inv.status === 'pending');
    if (invoicesToProcess.length === 0 && !invoices.some(inv => inv.status === 'processing')) {
      toast({
        title: "No Invoices to Process",
        description: "Please upload new invoices or ensure there are pending invoices.",
        variant: "default",
      });
      return;
    }
    if (isProcessing) {
      toast({
        title: "Processing Underway",
        description: "Invoices are already being processed. Please wait.",
        variant: "default",
      });
      return;
    }

    
      // Get user ID for request limiter
      let userId = null;
      if (user?.userId || user?._id) {
        userId = user.userId || user._id;
      } else if (session?.user && ((session.user as any)?.id || (session.user as any)?._id)) {
        userId = (session.user as any).id || (session.user as any)._id;
      }
      
      if (!await requestLimiter.canProcessRequest(userId ? { userId, _id: userId } : null)) {
        toast({
          title: "Request Limit Reached",
          description: "You've used your 3 free requests. Please register to get 5 more requests.",
          variant: "destructive",
        });
        setRequestError("You've used your 3 free requests. Please register to get 5 more requests.");
        return;
      }
    
      // ✅ Record the request only once
      requestLimiter.recordRequest(userId ? { userId, _id: userId } : null);
    

    

    setIsProcessing(true);
    setProcessingProgress(0);

    let processedFileCount = 0;
    const totalFilesToProcess = invoicesToProcess.length;
    let newlyExtractedCountThisBatch = 0;
    let successfulApiCalls = 0;

    const existingSignatures = new Set<string>(
      invoices
        .filter(inv => inv.status === 'completed' && inv.extractedData)
        .flatMap(inv => {
          if (inv.extractedData && inv.fileName.includes('(Invoice ')) {
            return [createInvoiceSignature(inv.extractedData)];
          }
          return inv.extractedData ? [createInvoiceSignature(inv.extractedData)] : [];
        })
    );

    const maxExistingIndex = invoices.reduce((max, inv) =>
      (inv.processingOrderIndex !== undefined && inv.processingOrderIndex > max) ? inv.processingOrderIndex : max,
      -1
    );
    let globalProcessingOrderIndex = maxExistingIndex + 1;

    let tempInvoicesAccumulator = [...invoices];

    for (const currentFileInvoice of invoicesToProcess) {
      let processedOriginalFileEntry: ProcessedInvoice = {
        ...currentFileInvoice,
        status: 'processing'
      };

      tempInvoicesAccumulator = tempInvoicesAccumulator.map(inv =>
        inv.id === currentFileInvoice.id ? processedOriginalFileEntry : inv
      );
      setInvoices([...tempInvoicesAccumulator]);

      let newUniqueEntriesForThisFile: ProcessedInvoice[] = [];
      let duplicatesFoundInFile = 0;

      try {
        const invoiceDataUri = await fileToDataUri(processedOriginalFileEntry.file);
        const extractedResults: SingleInvoiceExtractOutput[] = await extractInvoiceData({ invoiceDataUri, invoiceType });


        console.log("extractedResults", extractedResults);
        console.log("extractedResults.length", extractedResults.length);


        
        


        if (extractedResults && extractedResults.length > 0) {
          for (let index = 0; index < extractedResults.length; index++) {
            const singleInvoiceData = extractedResults[index];
            const signature = createInvoiceSignature(singleInvoiceData);

            console.log("singleInvoiceData", singleInvoiceData);
            console.log("singleInvoiceData.invoice_number", existingSignatures.has(signature));


            if(user){
              const userId = user.userId || user._id;
              try {
                console.log("Dashboard - Saving invoice for userId:", userId);
                await sendInvoiceToAPI(singleInvoiceData, userId);
                successfulApiCalls++;
              } catch (error) {
                console.error('Failed to save invoice to database:', error);
                // Continue processing even if API call fails
              }
    
            }

            if (!existingSignatures.has(signature)) {
              existingSignatures.add(signature);


              console.log("Dashboard - User context: before invoice record", user, session.user);
              
              
              
              
                
             
              
              newUniqueEntriesForThisFile.push({
                id: `${processedOriginalFileEntry.id}_inv${index + 1}`,
                file: processedOriginalFileEntry.file,
                fileName: extractedResults.length > 1 ? `${processedOriginalFileEntry.fileName} (Invoice ${index + 1})` : processedOriginalFileEntry.fileName,
                fileSize: processedOriginalFileEntry.fileSize,
                fileType: processedOriginalFileEntry.fileType,
                status: 'completed',
                extractedData: singleInvoiceData,
                processingOrderIndex: globalProcessingOrderIndex++, // Assign and increment
              });
              newlyExtractedCountThisBatch++;
            } else {
              duplicatesFoundInFile++;
            }
            
          }

          if (duplicatesFoundInFile > 0) {
            toast({
              title: "Duplicates Skipped",
              description: `${duplicatesFoundInFile} duplicate invoice data entries from ${processedOriginalFileEntry.fileName} were skipped.`,
            });
          }

          if (newUniqueEntriesForThisFile.length === 0 && extractedResults.length > 0) {
            processedOriginalFileEntry.status = 'completed';
            processedOriginalFileEntry.errorMessage = `All ${extractedResults.length} invoice(s) in ${processedOriginalFileEntry.fileName} were duplicates.`;
            delete processedOriginalFileEntry.extractedData;
          } else if (newUniqueEntriesForThisFile.length === 0 && (!extractedResults || extractedResults.length === 0)) {
            processedOriginalFileEntry.status = 'completed';
            processedOriginalFileEntry.errorMessage = `No invoices found in ${processedOriginalFileEntry.fileName}.`;
            delete processedOriginalFileEntry.extractedData;
          }

        } else {
          processedOriginalFileEntry.status = 'completed';
          processedOriginalFileEntry.errorMessage = `No invoices found by AI in ${processedOriginalFileEntry.fileName}.`;
          delete processedOriginalFileEntry.extractedData;
        }
      } catch (error: any) {
        // Simplified error logging
        let errorMessage = "Unknown error in extractInvoiceDataFlow";
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }
        const inputHint = `invoiceType: ${invoiceType}, fileNameHint (first 50 chars): ${processedOriginalFileEntry?.file?.name?.substring(0, 50) + "..."}`;
        console.error(`Error processing file: "${processedOriginalFileEntry.fileName}" ${errorMessage}. Input hint: ${inputHint}`);
        if (error instanceof Error && error.stack) {
          console.error("Stack trace:", error.stack);
        }

        processedOriginalFileEntry.status = 'error';
        processedOriginalFileEntry.errorMessage = error.message || "Unknown error during extraction";
        toast({
          title: "Extraction Error",
          description: `Failed to process ${processedOriginalFileEntry.fileName}: ${processedOriginalFileEntry.errorMessage}`,
          variant: "destructive",
        });
      }

      tempInvoicesAccumulator = tempInvoicesAccumulator.filter(inv => inv.id !== currentFileInvoice.id);

      if (newUniqueEntriesForThisFile.length > 0) {
        tempInvoicesAccumulator.push(...newUniqueEntriesForThisFile);
      } else {
        tempInvoicesAccumulator.push(processedOriginalFileEntry);
      }

      setInvoices([...tempInvoicesAccumulator]);
      processedFileCount++;
      setProcessingProgress(Math.round((processedFileCount / totalFilesToProcess) * 100));
    }

    setIsProcessing(false);

    console.log("successfull api call after processing", successfulApiCalls);

    // Update package requests if we had successful API calls
    if (successfulApiCalls > 0) {
      let userId = null;
      if (user?.userId || user?._id) {
        userId = user.userId || user._id;
      } else if (session?.user?.id || session?.user?._id) {
        userId = session.user.id || session.user._id;
      }
      
      if (userId) {
        try {
          console.log("Dashboard - Updating package requests for userId:", userId);
          await updatePackageRequests(userId, successfulApiCalls);
          console.log(`Updated package requests: ${successfulApiCalls} invoices saved`);
        } catch (error) {
          console.error('Failed to update package requests:', error);
        }
      } else {
        console.log("Dashboard - No user ID available for updating package requests");
      }
    }

    if (totalFilesToProcess > 0) {
      const allCompletedInvoicesForSnapshot = tempInvoicesAccumulator.filter(
        inv => inv.status === 'completed' && inv.extractedData
      );

      const totalInvoicesInTable = tempInvoicesAccumulator.filter(
        inv => inv.status === 'completed' && inv.extractedData
      ).length;
      
      toast({
        title: "Processing Complete",
        description: `Processed ${totalFilesToProcess} file(s). ${newlyExtractedCountThisBatch} new unique invoice(s) extracted. ${successfulApiCalls > 0 ? `${successfulApiCalls} saved to database.` : ''} Total in table: ${totalInvoicesInTable}.`,
      });

      let excelDataUriForLog: string | undefined = undefined;
      if (allCompletedInvoicesForSnapshot.length > 0) {
        try {
          const excelBlob = generateExcelBlob(allCompletedInvoicesForSnapshot);
          if (excelBlob.size > 0) {
            excelDataUriForLog = await blobToDataUri(excelBlob);
          } else {
            console.warn("Generated Excel blob for activity log is empty.");
          }
        } catch (error) {
          console.error("Error generating Excel for activity log:", error);
          toast({
            title: "Activity Log Error",
            description: "Could not generate Excel snapshot for activity log.",
            variant: "destructive"
          });
        }
      }

      logActivity("View List", excelDataUriForLog);
    }
    // Merge with existing database invoices
    const existingDbInvoices = invoices.filter(inv => inv.id.startsWith('db_'));
    setInvoices([...existingDbInvoices, ...tempInvoicesAccumulator]); // Final update after all processing and logging
  }, [invoices, toast, isProcessing, logActivity, invoiceType, user, updatePackageRequests]);


  const handleSort = (column: SortableColumnKey | null) => {
    if (!column) return;
    setSortConfig(prevConfig => ({
      column,
      direction: prevConfig.column === column && prevConfig.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const completedInvoices = useMemo(() => {
    const filtered = invoices.filter(
      (inv) => inv.status === 'completed' && inv.extractedData
    );

    if (sortConfig.column) {
      const sorted = [...filtered].sort((a, b) => {
        if (a.processingOrderIndex === undefined || b.processingOrderIndex === undefined || !a.extractedData || !b.extractedData) return 0;

        let valA: any;
        let valB: any;

        switch (sortConfig.column) {
          case 'processingOrder':
            valA = a.processingOrderIndex;
            valB = b.processingOrderIndex;
            break;
          case 'invoice_date':
            valA = parseDate(a.extractedData.invoice_date);
            valB = parseDate(b.extractedData.invoice_date);
            if (valA === null && valB === null) return 0;
            if (valA === null) return sortConfig.direction === 'ascending' ? 1 : -1;
            if (valB === null) return sortConfig.direction === 'ascending' ? -1 : 1;
            return (sortConfig.direction === 'ascending' ? 1 : -1) * (valA.getTime() - valB.getTime());
          case 'invoice_number':
          case 'trn_number':
          case 'vendor_name':
            valA = (a.extractedData as any)[sortConfig.column!]?.toString().toLowerCase() || '';
            valB = (b.extractedData as any)[sortConfig.column!]?.toString().toLowerCase() || '';
            break;
          case 'total_before_tax':
          case 'vat_amount':
          case 'total_amount':
            valA = parseFloat(((a.extractedData as any)[sortConfig.column!] || '0').replace(/[^0-9.-]+/g, "")) || 0;
            valB = parseFloat(((b.extractedData as any)[sortConfig.column!] || '0').replace(/[^0-9.-]+/g, "")) || 0;
            break;
          default:
            return 0;
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
      return sorted;
    }

    // Default sort by processingOrderIndex ascending, with database invoices first
    return [...filtered].sort((a, b) => {
      // Database invoices come first
      const aIsDb = a.id.startsWith('db_');
      const bIsDb = b.id.startsWith('db_');
      
      if (aIsDb && !bIsDb) return -1;
      if (!aIsDb && bIsDb) return 1;
      
      // Then sort by processingOrderIndex
      if (a.processingOrderIndex === undefined || b.processingOrderIndex === undefined) return 0;
      return (a.processingOrderIndex ?? 0) - (b.processingOrderIndex ?? 0);
    });
  }, [invoices, sortConfig]);


  const handleExport = () => {
    if (completedInvoices.length === 0) {
      toast({
        title: "No Data to Export",
        description: "Please upload and process invoices first.",
        variant: "destructive",
      });
      return;
    }
    exportToExcel(completedInvoices, `invoice_insights_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({
      title: "Export Successful",
      description: "Invoice data has been exported to Excel.",
    });
  };

  const handleClearAll = () => {
    // Only clear non-database invoices (keep user's saved invoices)
    const dbInvoices = invoices.filter(inv => inv.id.startsWith('db_'));
    setInvoices(dbInvoices);
    setProcessingProgress(0);
    setIsProcessing(false);
    toast({
      title: "Cleared",
      description: "All uploaded invoice data has been cleared. Your saved invoices remain.",
    });
  };

  const pendingInvoicesCount = useMemo(() => invoices.filter(inv => inv.status === 'pending').length, [invoices]);
  const hasAnyInvoiceEntries = useMemo(() => invoices.length > 0, [invoices]);
  const canProcess = useMemo(() => pendingInvoicesCount > 0 && !isProcessing, [pendingInvoicesCount, isProcessing]);

  return (
    <>

      

      <ActivitySidebarContent
        activityLog={activityLog}
        onRenameEntry={handleRenameActivityEntry}
        onOpenSettings={() => setIsSettingsPanelOpen(true)}
      />
      <SettingsPanel isOpen={isSettingsPanelOpen} onOpenChange={setIsSettingsPanelOpen} />
      <SidebarInset>
        <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-background relative">

          {/* {!isSidebarActuallyOpen && (
            <div className="absolute top-6 left-6 z-20">
              <SidebarTrigger
                aria-label="Toggle Activity Log"
                className="bg-card hover:bg-muted/80 p-2 rounded-full shadow-md border border-border/50"
              >
                <HistoryIcon className="h-6 w-6 text-primary hover:text-accent transition-colors" />
              </SidebarTrigger>
            </div>
          )} */}
          {/* <div className="absolute top-6 right-6 z-20">
            <ThemeToggle />
          </div> */}


          <header className="mb-10 text-center pt-16">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary-foreground/90 pb-2">
              <ScanText className="inline-block h-12 w-12 mr-3 -mt-1.5 text-primary" />
              Invoice Insights
            </h1>
            <p className="text-muted-foreground mt-4 text-xl">
              Upload your invoices and extract key data effortlessly.
            </p>
          </header>

          <main className="flex-grow space-y-8">
            <section>
              <InvoiceUploader
                onFilesAccepted={handleFilesAccepted}
                isProcessing={isProcessing}
                processingProgress={processingProgress}
                uploadedFiles={invoices.filter(inv =>
                  inv.status === 'pending' ||
                  inv.status === 'processing' ||
                  (inv.status === 'error' && !inv.extractedData) ||
                  (inv.status === 'completed' && !inv.extractedData && inv.errorMessage)
                )}
                invoiceType={invoiceType}
                onInvoiceTypeChange={setInvoiceType}
              />
            </section>

            <section className="my-6 flex justify-start">
              <Button
                onClick={handleProcessInvoices}
                size="default"
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-150 ease-in-out px-7 py-4 text-base group"
                aria-label={pendingInvoicesCount > 0 ? `Process ${pendingInvoicesCount} uploaded invoices` : "Process Invoices"}
                disabled={!canProcess && isProcessing}
              >
                <Play className="mr-2 h-6 w-6 group-hover:animate-pulse" />
                Process Invoice{pendingInvoicesCount !== 1 ? 's' : ''}
                {pendingInvoicesCount > 0 && ` (${pendingInvoicesCount})`}
                <Touchpad className="ml-2 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity duration-150 ease-in-out hidden sm:inline-block" />
              </Button>
            </section>

            <section>
              <InvoiceDataTable
                invoices={completedInvoices}
                sortConfig={sortConfig}
                onSort={handleSort}
              />
            </section>

            {hasAnyInvoiceEntries && (
              <section className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-10 p-6 bg-card rounded-xl shadow-xl border border-border/50">
                <Button
                  onClick={handleExport}
                  disabled={isProcessing || completedInvoices.length === 0}
                  className="w-full sm:w-auto bg-gradient-to-r from-accent to-orange-400 hover:from-accent/90 hover:to-orange-400/90 text-accent-foreground shadow-md hover:shadow-lg transform hover:scale-105 transition-transform"
                  aria-label="Export all completed invoices to Excel"
                >
                  <Download className="mr-2 h-5 w-5" /> Export to Excel ({completedInvoices.length})
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={isProcessing}
                  className="w-full sm:w-auto shadow-md hover:shadow-lg transform hover:scale-105 transition-transform border-border hover:bg-muted/50"
                  aria-label="Clear all uploaded invoices and extracted data"
                >
                  <RefreshCw className="mr-2 h-5 w-5" /> Clear All
                </Button>
              </section>
            )}
          </main>

          <footer className="text-center py-10 text-muted-foreground text-base mt-auto">
            <p>&copy; {new Date().getFullYear()} Invoice Insights. AI-Powered Data Extraction.</p>
          </footer>
        </div>
      </SidebarInset>
    </>
  );
}


export default function InvoiceInsightsPage() {
  const [clientMounted, setClientMounted] = useState(false);
  useEffect(() => {
    setClientMounted(true);
  }, []);

  if (!clientMounted) {
    return (
      <div className="container mx-auto p-4 md:p-8 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <ScanText className="h-16 w-16 text-primary animate-pulse" />
        <p className="text-muted-foreground mt-4 text-xl">Loading Invoice Insights...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>

      <PageContent />
    </SidebarProvider>
  );
}

