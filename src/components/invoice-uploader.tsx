
"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, XCircle, FileUp, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import type { ProcessedInvoice } from '@/types/invoice';
import type { InvoiceType } from '@/app/page'; // Import InvoiceType
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface InvoiceUploaderProps {
  onFilesAccepted: (files: File[]) => void;
  isProcessing: boolean;
  processingProgress?: number;
  uploadedFiles?: ProcessedInvoice[];
  invoiceType: InvoiceType; // Receive from parent
  onInvoiceTypeChange: (type: InvoiceType) => void; // Receive from parent
}

const acceptedFileTypes = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export function InvoiceUploader({ 
  onFilesAccepted, 
  isProcessing, 
  processingProgress, 
  uploadedFiles = [],
  invoiceType, // Use prop
  onInvoiceTypeChange // Use prop
}: InvoiceUploaderProps) {
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([]);
  // Removed local invoiceType state, now managed by parent

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (isProcessing) return; 
    onFilesAccepted(acceptedFiles);
    setRejectedFiles(fileRejections.map((rejection: any) => rejection.file));
  }, [onFilesAccepted, isProcessing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: true,
    disabled: isProcessing,
  });

  return (
    <Card className="w-full shadow-xl border border-border/50 rounded-xl overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/50">
        <CardTitle className="flex items-center justify-between text-2xl font-semibold text-foreground">
          <div className="flex items-center gap-3">
            <FileUp className="h-7 w-7 text-primary" />
            <span>Upload Your Invoices</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="whitespace-nowrap">
                {invoiceType === 'purchase' ? 'Purchase Invoice' : 'Sales Invoice'}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-auto min-w-[10rem]">
              <DropdownMenuItem onSelect={() => onInvoiceTypeChange('purchase')}>
                Purchase Invoice
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onInvoiceTypeChange('sales')}>
                Sales Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <div
          {...getRootProps()}
          className={`p-8 md:p-12 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-150 ease-in-out
            ${isDragActive && !isProcessing ? 'border-primary bg-primary/10 scale-105 shadow-inner' : 'border-border hover:border-primary/70'}
            ${isProcessing ? 'cursor-not-allowed opacity-60 bg-muted/20' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-center min-h-[120px]">
            {isProcessing && processingProgress === 0 ? ( 
              <>
                <Loader2 className="h-12 w-12 mb-4 text-primary animate-spin" />
                <p className="text-xl font-semibold text-primary">Preparing to Process...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Getting invoices ready for AI extraction.
                </p>
              </>
            ) : isDragActive ? (
              <>
                <UploadCloud className="h-12 w-12 mb-4 text-primary animate-bounce" data-ai-hint="cloud upload" />
                <p className="text-xl font-semibold text-primary">Drop files here to upload!</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-12 w-12 mb-4 text-muted-foreground group-hover:text-primary transition-colors" data-ai-hint="cloud upload" />
                <p className="text-xl font-semibold text-foreground">
                  Drag & drop files, or click to select
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports PDF, JPG, PNG, GIF, WEBP formats.
                </p>
              </>
            )}
          </div>
        </div>
        
        {isProcessing && processingProgress !== undefined && processingProgress > 0 && (
           <div className="mt-6">
             <Progress value={processingProgress} className="w-full h-3 rounded-full shadow-inner" />
             <p className="text-sm font-medium text-muted-foreground text-center mt-2">{processingProgress}% Extracted</p>
           </div>
         )}

        {uploadedFiles.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-foreground mb-3">Selected Files:</h4>
            <ScrollArea className="h-40 rounded-md border">
              <div className="p-2 space-y-1">
                {uploadedFiles.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/20 transition-colors duration-150 ease-in-out">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate" title={invoice.fileName}>
                          {invoice.fileName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(invoice.fileSize)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        invoice.status === 'completed' ? 'outline' :
                        invoice.status === 'error' ? 'destructive' :
                        invoice.status === 'processing' ? 'outline' :
                        'outline'
                      }
                      className={cn(
                        "ml-2 flex-shrink-0 px-2.5 py-0.5 text-xs font-medium",
                        invoice.status === 'completed' && 'border-green-500 bg-green-100/80 text-green-700',
                        invoice.status === 'processing' && 'border-blue-500 bg-blue-100/80 text-blue-700',
                        invoice.status === 'pending' && 'text-muted-foreground border-border',
                      )}
                    >
                      {invoice.status === 'processing' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {rejectedFiles.length > 0 && !isProcessing && (
          <div className="mt-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
            <h4 className="text-md font-semibold text-destructive mb-2 flex items-center">
              <XCircle className="h-5 w-5 mr-2" />
              Unsupported Files:
            </h4>
            <ul className="space-y-1 text-sm text-destructive/90">
              {rejectedFiles.map((file, index) => (
                <li key={index} className="flex items-center">
                  <FileText className="h-4 w-4 mr-1.5 flex-shrink-0" />
                  <span className="truncate" title={file.name}>{file.name} - {(file.size / 1024).toFixed(2)} KB</span>
                </li>
              ))}
            </ul>
            <Button variant="ghost" size="sm" onClick={() => setRejectedFiles([])} className="mt-3 text-destructive hover:bg-destructive/20 h-auto py-1.5 px-2.5">
              Clear Rejected
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
