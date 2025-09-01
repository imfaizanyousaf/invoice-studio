"use client"

import React, { useEffect, useState } from "react";
import Link from "next/link"; // ⬅️ add this
import { useUser } from "@/context/UserContext";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { usePackage } from "@/context/PackageContext";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LogOut, LayoutDashboard } from "lucide-react";
import { ADMIN_EMAILS } from "@/lib/constants";


const Header = () => {
  const { user, logout } = useUser();
  const { userPackage, getPackage, loading } = usePackage();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchPackage = async () => {
      if (user?.userId && !userPackage) {
        try {
          const pkg = await getPackage(user.userId);
          setCredits(pkg.requests);
        } catch (error) {
          console.error("Error fetching package:", error);
          setCredits(0);
        }
      } else if (userPackage) {
        setCredits(userPackage.requests);
      }
    };
    fetchPackage();
  }, [user?.userId, userPackage, getPackage]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="w-full bg-card border border-border py-4 px-6 flex items-center justify-between rounded-xl">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-foreground">
          Hello {user?.name || "Guest"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Welcome to your dashboard
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <p className="text-foreground">Credits: </p>
          <p className="text-foreground">
            {loading ? "..." : credits ?? "N/A"}
          </p>
        </div>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-12 h-12 rounded-full hover:bg-muted/50 transition-colors">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="User Avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-12 h-12 text-muted-foreground" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User info (label OK here) */}
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Admin Dashboard as an actionable item with hover bg */}
            {ADMIN_EMAILS.includes(user?.email) && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/admin-dashboard" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Admin Dashboard</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Header;
