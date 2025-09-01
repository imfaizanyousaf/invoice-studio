"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, CreditCard, SidebarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityBar } from "./ActivityBar";
import {ActivityBarContent} from "./ActivityBarContent";

const Navbar = () => {
  const { user, logout } = useUser();
  const pathname = usePathname();

  // Hide navbar on dashboard routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin-dashboard")
  ) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div
      className={`container flex justify-between items-center transition-all duration-300 p-4 w-full mx-auto z-10 bg-transparent border-none rounded-none shadow-none`}
    >
      <div className="space-x-4">
        {pathname == "/" && 
          <ActivityBar trigger={
              <Button variant="outline" className="rounded-full w-10 h-10" size="icon">
                <SidebarIcon />
              </Button>}>
            <ActivityBarContent />
          </ActivityBar>
        }
        {pathname !== "/" && (
          <Link
            href={"/"}
            className="text-foreground hover:text-primary transition-colors"
          >
            Home
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <Link
            href={user.role == "admin" ? "admin-dashboard" : "/dashboard"}
            className="text-foreground hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
        )}

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Dropdown Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/50 transition-colors">
                <UserCircleIcon className="w-8 h-8 text-muted-foreground hover:text-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!user && (
          <>
            {/*<Link href="/signup" className="text-foreground hover:text-primary transition-colors">Signup</Link> */}
            <Link href="/signin">
              <Button>Sign In</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
