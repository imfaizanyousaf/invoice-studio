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
import UserMenu from "./UserMenu";
// import { ADMIN_EMAILS } from "@/lib/constants";

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

        {user && <UserMenu />}
      </div>
    </div>
  );
};

export default Header;
