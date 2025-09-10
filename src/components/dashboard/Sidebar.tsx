"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import { SidebarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ListTree,
  DownloadCloud,
  Pencil,
  Check,
  X,
  Settings as SettingsIcon,
} from "lucide-react";
import { format } from "date-fns";
import { saveAs } from "file-saver";

const Sidebar = () => {
  const { isOpen, toggleSidebar, setIsOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useUser();
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>("");

  const [activities, setActivities] = useState<any[]>([]);

  const fetchActivities = async () => {
      try {
        const res = await fetch(
          `/api/activity?userId=${user?.userId || user?._id}&limit=10`
        );
        const data = await res.json();

        // group into array of { date, entries }
        const grouped = Object.values(
          data.reduce((acc, activity) => {
            const date = new Date(activity.timestamp)
              .toISOString()
              .split("T")[0];
            if (!acc[date]) {
              acc[date] = { date, entries: [] };
            }
            acc[date].entries.push({
              ...activity,
              id: activity._id, // so entry.id works in JSX
            });
            return acc;
          }, {})
        );

        // sort groups by date desc
        grouped.sort((a, b) => new Date(b.date) - new Date(a.date));

        setActivities(grouped);
      } catch (err) {
        console.error("Error fetching activities:", err);
      }
    };


  const renameActivity = async () => {
    try {
      await fetch(`/api/activity/${editingEntryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editText.trim(),
        }),
      });
      await fetchActivities();
    } catch (err) {
      console.error("Error updating activity:", err);
    }
  };

  useEffect(() => {
    if (!user?.userId && !user?._id) return;
    fetchActivities();
    const handler = () => fetchActivities();
    window.addEventListener("activityLogUpdated" as any, handler);
    return () => {
      window.removeEventListener("activityLogUpdated" as any, handler);
    };
  }, [user]);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  const handleSaveRename = () => {
    if (editText.trim()) {
      renameActivity();
    }
    setEditingEntryId(null);
    setEditText("");
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditText("");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 ${
        isOpen ? "w-[14vw]" : "w-[3vw]"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <div className={`w-full hidden md:flex items-center ${isOpen ? "justify-end p-4" : "justify-center py-2"}`}>
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="rounded-full !w-8 !h-8"
            size="icon"
          >
            <SidebarIcon />
          </Button>
        </div>

        {/* Activities */}
        <ScrollArea className={` px-2 ${isOpen ? "flex-1" : "hidden"   }`}>
          {activities?.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No activity yet. Process invoices to log activity.
            </div>
          ) : (
            activities &&
            activities?.map((group) => (
              <div key={group.date} className="mb-4">
                <p className="px-2 mb-2 text-xs font-semibold text-muted-foreground">
                  {format(new Date(group.date + "T00:00:00Z"), "MMMM d, yyyy")}
                </p>
                <div className="space-y-1">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between group px-2 py-1 hover:bg-muted rounded-md w-fit"
                    >
                      {editingEntryId === entry.id ? (
                        <div className="flex-grow flex items-center gap-1.5">
                          <ListTree className="!h-4 !w-4 text-muted-foreground" />
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename();
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                            className="h-7 text-sm flex-grow"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <button className="flex-grow flex items-center text-sm text-left">
                          <ListTree className="!h-4 !w-4 mr-2 text-muted-foreground" />
                          <span className="w-32 truncate">
                            {entry.label} (
                            {format(new Date(entry.timestamp), "p")})
                          </span>
                        </button>
                      )}
                      <div className="flex items-center ml-2 space-x-1">
                        {editingEntryId === entry.id ? (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleSaveRename(entry.id)}
                              className="h-6 w-6 p-1 text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEdit}
                              className="h-6 w-6 p-1 text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingEntryId(entry.id);
                              setEditText(entry.label);
                            }}
                            className="h-6 w-6 p-1 text-muted-foreground opacity-0 group-hover:opacity-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {entry.excelFileDataUri && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              saveAs(
                                entry.excelFileDataUri!,
                                `invoice_snapshot.xlsx`
                              )
                            }
                            className="h-6 w-6 p-1 text-muted-foreground opacity-0 group-hover:opacity-100"
                          >
                            <DownloadCloud className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      </div>
    </aside>
  );
};

export default Sidebar;
