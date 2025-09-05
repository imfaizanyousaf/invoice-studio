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
import { Button } from "../ui/button";

const menuItems = [
  { name: "Home", icon: HomeIcon, href: "/dashboard" },
  {
    name: "My Credits",
    icon: ClipboardDocumentListIcon,
    href: "/dashboard/subscriptions",
  },
  { name: "Settings", icon: Cog6ToothIcon, href: "/dashboard/settings" },
  {
    name: "Contact",
    icon: ClipboardDocumentListIcon,
    href: "/dashboard/contact",
  },
];

const Sidebar = () => {
  const { isOpen, toggleSidebar, setIsOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useUser();

  const [activities, setActivities] = useState<any[]>([]);

  // fetch activities for logged in user
  useEffect(() => {
    if (!user?.userId || user?._id) return;

    const fetchActivities = async () => {
      try {
        const res = await fetch(
          `/api/activity/${user?.userId || user?._id}?limit=10`
        );
        const data = await res.json();
        setActivities(data || []);
      } catch (err) {
        console.error("Error fetching activities:", err);
      }
    };

    fetchActivities();
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

  const handleLogout = () => {
    toast.info("Logging out...", { duration: 1000 });
    logout();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 ${
        isOpen ? "w-64" : "w-16"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <div className="w-full p-4 hidden md:flex justify-end items-center">
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="rounded-full"
            size="icon"
          >
            <SidebarIcon />
          </Button>
        </div>

        {/* Activities */}
        <div>
          {isOpen && (
            <h3 className="px-3 mb-2 text-sm font-semibold text-muted-foreground">
              Recent Activities
            </h3>
          )}
          <ul className="space-y-1">
            {activities.length > 0 ? (
              activities.map((act) => (
                <li
                  key={act._id}
                  className={`px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/50 ${
                    !isOpen && "text-center"
                  }`}
                >
                  {isOpen ? act.label : "•"}
                </li>
              ))
            ) : (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {isOpen ? "No activities yet" : "—"}
              </li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
