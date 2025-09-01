
// src/components/activity-sidebar-content.tsx
"use client";

import React, { useState } from 'react';
import type { ActivityLog } from '@/types/activity';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar, 
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListTree, DownloadCloud, Pencil, Check, X, PanelLeft, Settings as SettingsIcon } from 'lucide-react';
import { format } from 'date-fns';
import { saveAs } from 'file-saver';
import { cn } from '@/lib/utils';

interface ActivitySidebarContentProps {
  activityLog: ActivityLog;
  onRenameEntry: (entryId: string, newLabel: string) => void;
  onOpenSettings: () => void;
}

export function ActivitySidebarContent({ activityLog, onRenameEntry, onOpenSettings }: ActivitySidebarContentProps) {
  const { toggleSidebar } = useSidebar(); 
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const handleStartEdit = (id: string, currentLabel: string) => {
    setEditingEntryId(id);
    setEditText(currentLabel);
  };

  const handleSaveRename = (id: string) => {
    if (editText.trim()) {
      onRenameEntry(id, editText.trim());
    }
    setEditingEntryId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditText("");
  };

  return (
    <Sidebar side="left" collapsible="offcanvas" variant="floating" className="border-sidebar-border">
      <SidebarHeader>
        <div className="p-4 flex items-center justify-start gap-2 border-b border-sidebar-border"> {/* Changed justify-between to justify-start and added gap */}
          <Button // Moved button to be before the title
            variant="ghost"
            size="icon"
            onClick={toggleSidebar} 
            aria-label="Close Activity Log" // Updated aria-label
            className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-sidebar-foreground">
            Activity Log
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full px-2"> 
          {activityLog.length === 0 && (
            <div className="p-4 text-center text-sm text-sidebar-foreground/70">
              No activity yet. Process invoices to log activity.
            </div>
          )}
          {activityLog.map((group) => (
            <SidebarGroup key={group.date}>
              <SidebarGroupLabel>
                {format(new Date(group.date + 'T00:00:00Z'), 'MMMM d, yyyy')}
              </SidebarGroupLabel>
              <SidebarMenu>
                {group.entries.map((entry) => {
                  const handleDownload = () => {
                    if (entry.excelFileDataUri) {
                      const timestampStr = format(new Date(entry.timestamp), 'yyyyMMdd_HHmmss');
                      const fileName = `invoice_snapshot_${timestampStr}.xlsx`;
                      fetch(entry.excelFileDataUri)
                        .then(res => res.blob())
                        .then(blob => {
                          if (blob.size > 0) {
                            saveAs(blob, fileName);
                          } else {
                            console.warn("Attempted to download an empty Excel file from activity log.");
                          }
                        })
                        .catch(err => {
                          console.error("Error downloading Excel from activity log:", err);
                        });
                    }
                  };

                  return (
                    <SidebarMenuItem key={entry.id}>
                       <div className="flex items-center justify-between w-full group">
                        {editingEntryId === entry.id ? (
                          <div className="flex-grow flex items-center gap-1.5">
                            <ListTree className="h-4 w-4 mr-1 flex-shrink-0 text-sidebar-foreground/70" />
                            <Input 
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(entry.id);
                                if (e.key === 'Escape') handleCancelEdit();
                              }}
                              className="h-7 text-sm flex-grow bg-sidebar-accent/50 border-sidebar-border focus:ring-sidebar-ring"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <SidebarMenuButton size="sm" className="flex-grow text-left pl-1">
                            <ListTree className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">
                              {entry.label} ({format(new Date(entry.timestamp), 'p')})
                            </span>
                          </SidebarMenuButton>
                        )}
                        
                        <div className="flex items-center flex-shrink-0 ml-1.5 space-x-0.5">
                          {editingEntryId === entry.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSaveRename(entry.id)}
                                aria-label="Save rename"
                                className="h-6 w-6 p-1 text-green-600 hover:bg-sidebar-accent hover:text-green-500"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                                aria-label="Cancel rename"
                                className="h-6 w-6 p-1 text-red-600 hover:bg-sidebar-accent hover:text-red-500"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(entry.id, entry.label)}
                                aria-label="Edit activity label"
                                className={cn(
                                  "h-6 w-6 p-1 text-sidebar-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                  entry.excelFileDataUri ? "" : "mr-[28px]" 
                                )}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {entry.excelFileDataUri && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={handleDownload}
                                  aria-label="Download Excel snapshot"
                                  className="h-6 w-6 p-1 text-sidebar-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-150 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                >
                                  <DownloadCloud className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter className="p-3 border-t border-sidebar-border flex items-center justify-between"> 
        <p className="text-xs text-sidebar-foreground/60">
          User activity history
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Open Settings"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
