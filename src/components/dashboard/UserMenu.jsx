import { useUser } from "@/context/UserContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings, CreditCard, SidebarIcon } from "lucide-react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import {
    HomeIcon,
    ClipboardDocumentListIcon,
    Cog6ToothIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import Link from "next/link";


export const UserMenu = () => {
    const { user, logout } = useUser();
    const menuItems = [
        { name: "Home", icon: HomeIcon, href: "/dashboard" },
        { name: "My Credits", icon: ClipboardDocumentListIcon, href: "/dashboard/subscriptions" },
        { name: "Settings", icon: Cog6ToothIcon, href: "/dashboard/settings" },
        { name: "Contact", icon: ClipboardDocumentListIcon, href: "/dashboard/contact" },
    ];
    const handleLogout = () => {
        toast.info("Logging out...", { duration: 1000 });
        logout();
      };

    return (
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
                {menuItems && menuItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                    <DropdownMenuItem key={item.name} className="cursor-pointer">
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.name}</span>
                    </DropdownMenuItem>
                    </Link>
                ))
                }

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
    );
};

export default UserMenu;
