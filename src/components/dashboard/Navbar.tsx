"use client";

import { useUser } from "@/context/UserContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityBar } from "./ActivityBar";
import {ActivityBarContent} from "./ActivityBarContent";
import {UserMenu} from "@/components/dashboard/UserMenu";

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
        {user && <UserMenu />}

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
