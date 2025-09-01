
"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, AlertTriangle, CalendarDays, ClipboardX, ListOrdered, ArrowUp, ArrowDown, ReceiptText, Building, DollarSign, Percent, Coins, FileKey, Database } from 'lucide-react';
import type { ProcessedInvoice } from '@/types/invoice';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { SortableColumnKey } from '@/app/page'; 
import { parseDate } from '@/app/page'; 
import { format } from 'date-fns'; 

interface InvoiceDataTableProps {
  invoices: ProcessedInvoice[];
  sortConfig: { column: SortableColumnKey | null; direction: 'ascending' | 'descending' };
  onSort: (column: SortableColumnKey) => void;
}

export function InvoiceDataTable({ invoices, sortConfig, onSort }: InvoiceDataTableProps) {
  const completedInvoices = invoices.filter(
    (invoice) => invoice.status === 'completed' && invoice.extractedData
  );

  const renderSortArrow = (columnKey: SortableColumnKey) => {
    if (sortConfig.column === columnKey) {
      return sortConfig.direction === 'ascending' ? 
        <ArrowUp className="h-4 w-4 ml-1.5 inline-block align-middle text-primary" /> : 
        <ArrowDown className="h-4 w-4 ml-1.5 inline-block align-middle text-primary" />;
    }
    return null;
  };

  if (invoices.length === 0) {
    return (
      <Card className="w-full mt-8 shadow-xl border border-border/50 rounded-xl">
        <CardHeader>
           <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-foreground">
             <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" /> Extracted Invoice Data
           </CardTitle>
           <CardDescription className="text-sm sm:text-base">Upload invoices to see their extracted data populate here.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center">
            <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 opacity-50" />
            <p className="text-lg sm:text-xl font-medium mb-2">No Invoices Processed Yet</p>
            <p className="text-sm sm:text-md px-4">Once you upload and process invoices, the details will appear in this table.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (completedInvoices.length === 0) {
    return (
      <Card className="w-full mt-8 shadow-xl border border-border/50 rounded-xl">
        <CardHeader>
           <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-foreground">
             <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" /> Extracted Invoice Data
           </CardTitle>
           <CardDescription className="text-sm sm:text-base">Successfully extracted data from your invoices will appear here once processing is complete.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 sm:py-12 text-muted-foreground flex flex-col items-center justify-center">
            <ClipboardX className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 opacity-50" />
            <p className="text-lg sm:text-xl font-medium mb-2">No Data Extracted Yet</p>
            <p className="text-sm sm:text-md px-4">Process your uploaded invoices. Data from successfully processed invoices will appear here.</p>
            {invoices.some(inv => inv.status === 'processing') && (
              <div className="mt-4 flex items-center text-sm text-blue-600">
                Some invoices are still processing...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile view - card layout
  const MobileInvoiceCard = ({ invoice, index }: { invoice: ProcessedInvoice; index: number }) => {
    const dateValue = invoice.extractedData?.invoice_date;
    let displayDate = 'N/A';
    if (dateValue) {
      const parsed = parseDate(dateValue);
      if (parsed) {
        try {
          displayDate = format(parsed, 'dd-MMM-yyyy');
        } catch (e) {
          displayDate = dateValue; 
        }
      } else {
        displayDate = dateValue; 
      }
    }

    const isDbInvoice = invoice.id.startsWith('db_');

    return (
      <Card key={invoice.id} className="mb-4 border border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
              {isDbInvoice && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Database className="h-4 w-4 text-blue-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Saved to database</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{displayDate}</span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Invoice No:</span>
              <p className="truncate">{invoice.extractedData?.invoice_number || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">TRN:</span>
              <p className="truncate">{invoice.extractedData?.trn_number || 'N/A'}</p>
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground text-sm">Vendor:</span>
            <p className="truncate text-sm">{invoice.extractedData?.vendor_name || 'N/A'}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground text-xs">Before Tax:</span>
              <p className="truncate">{invoice.extractedData?.total_before_tax || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground text-xs">VAT:</span>
              <p className="truncate">{invoice.extractedData?.vat_amount || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground text-xs">Total:</span>
              <p className="truncate font-semibold">{invoice.extractedData?.total_amount || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className="w-full mt-8 shadow-xl border border-border/50 rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50">
        <CardTitle className="text-xl sm:text-2xl font-semibold flex items-center gap-3 text-foreground">
          <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" /> Extracted Invoice Data
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          Data extracted from successfully processed invoices. {window.innerWidth > 768 ? 'Click headers to sort. Default sort is by upload order.' : 'Swipe to see more data.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile View */}
        <div className="block md:hidden p-4">
          <div className="space-y-2">
            {completedInvoices.map((invoice, index) => (
              <MobileInvoiceCard key={invoice.id} invoice={invoice} index={index} />
            ))}
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden md:block">
        <ScrollArea className="h-[450px] w-full whitespace-nowrap">
          <Table className="min-w-full">
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
              <TableRow>
                <TableHead 
                    className="px-3 py-3 font-semibold whitespace-nowrap text-left cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ width: '60px', minWidth: '60px' }}
                  onClick={() => onSort('processingOrder')}
                >
                  <ListOrdered className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                  <span className="inline-block align-middle">#</span>
                  {renderSortArrow('processingOrder')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold whitespace-nowrap text-left cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '120px' }}
                  onClick={() => onSort('invoice_date')}
                >
                  <CalendarDays className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                    <span className="inline-block align-middle">Date</span>
                  {renderSortArrow('invoice_date')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold whitespace-nowrap text-left cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '140px' }}
                  onClick={() => onSort('invoice_number')}
                >
                  <FileKey className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                  <span className="inline-block align-middle">Invoice No.</span>
                  {renderSortArrow('invoice_number')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold whitespace-nowrap text-left cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '140px' }}
                  onClick={() => onSort('trn_number')}
                >
                  <ReceiptText className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                    <span className="inline-block align-middle">TRN</span>
                  {renderSortArrow('trn_number')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold whitespace-nowrap text-left cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '200px' }}
                  onClick={() => onSort('vendor_name')}
                >
                  <Building className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                    <span className="inline-block align-middle">Vendor</span>
                  {renderSortArrow('vendor_name')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '120px' }}
                  onClick={() => onSort('total_before_tax')}
                >
                  <Coins className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                    <span className="inline-block align-middle">Before Tax</span>
                  {renderSortArrow('total_before_tax')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '100px' }}
                  onClick={() => onSort('vat_amount')}
                >
                  <Percent className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                    <span className="inline-block align-middle">VAT</span>
                  {renderSortArrow('vat_amount')}
                </TableHead>
                <TableHead 
                    className="px-3 py-3 font-semibold text-right whitespace-nowrap cursor-pointer hover:bg-muted/70 transition-colors" 
                    style={{ minWidth: '120px' }}
                  onClick={() => onSort('total_amount')}
                >
                  <DollarSign className="h-4 w-4 mr-1.5 text-muted-foreground inline-block align-middle"/>
                    <span className="inline-block align-middle">Total</span>
                  {renderSortArrow('total_amount')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedInvoices.map((invoice, index) => {
                const dateValue = invoice.extractedData?.invoice_date;
                let displayDate = 'N/A';
                if (dateValue) {
                  const parsed = parseDate(dateValue);
                  if (parsed) {
                    try {
                      displayDate = format(parsed, 'dd-MMM-yyyy');
                    } catch (e) {
                      console.warn(`Could not format date: ${dateValue}`, e);
                      displayDate = dateValue; 
                    }
                  } else {
                    displayDate = dateValue; 
                  }
                }

                  const isDbInvoice = invoice.id.startsWith('db_');
                
                return (
                  <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors duration-150 ease-in-out">
                      <TableCell className="px-3 py-3 whitespace-nowrap text-left">
                        <div className="flex items-center gap-1">
                          <span>{index + 1}</span>
                          {isDbInvoice && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Database className="h-3 w-3 text-blue-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Saved to database</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 whitespace-nowrap text-left text-sm">{displayDate}</TableCell>
                      <TableCell className="px-3 py-3 whitespace-nowrap text-left text-sm">{invoice.extractedData?.invoice_number || 'N/A'}</TableCell>
                      <TableCell className="px-3 py-3 whitespace-nowrap text-left text-sm">{invoice.extractedData?.trn_number || 'N/A'}</TableCell>
                      <TableCell className="px-3 py-3 whitespace-nowrap text-left text-sm">
                      <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                               <span className="block truncate max-w-[180px]" title={invoice.extractedData?.vendor_name || undefined}>{invoice.extractedData?.vendor_name || 'N/A'}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{invoice.extractedData?.vendor_name || 'N/A'}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                    </TableCell>
                      <TableCell className="px-3 py-3 text-right whitespace-nowrap text-sm">{invoice.extractedData?.total_before_tax || 'N/A'}</TableCell>
                      <TableCell className="px-3 py-3 text-right whitespace-nowrap text-sm">{invoice.extractedData?.vat_amount || 'N/A'}</TableCell>
                      <TableCell className="px-3 py-3 text-right whitespace-nowrap text-sm font-medium">{invoice.extractedData?.total_amount || 'N/A'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

