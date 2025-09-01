import React, { useEffect } from "react";
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

const menuItems = [
  { name: "Home", icon: HomeIcon, href: "/dashboard" },
  { name: "My Credits", icon: ClipboardDocumentListIcon, href: "/dashboard/subscriptions" },
  { name: "Settings", icon: Cog6ToothIcon, href: "/dashboard/settings" },
  { name: "Contact", icon: ClipboardDocumentListIcon, href: "/dashboard/contact" },
];

const Sidebar = () => {
  const { isOpen, toggleSidebar, setIsOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useUser();

  // ✅ Collapse sidebar automatically below md
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false); // collapse
      } else {
        setIsOpen(true); // expand on desktop
      }
    };

    handleResize(); // Run on load
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsOpen]);

  const handleLogout = () => {
    toast.info("Logging out...", { duration: 1000 });
    logout();
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-card border-r border-border z-50 transition-all duration-300 ${isOpen ? "w-64" : "w-16"
        }`}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <div className="w-full p-4 hidden md:flex justify-end items-center">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isOpen ? (
              <ChevronDoubleLeftIcon className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDoubleRightIcon className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>


        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {/* <Link href="/" className="text-foreground hover:text-primary transition-colors">landing page</Link> */}
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground" : "hover:bg-muted/50 text-foreground"
                  } ${!isOpen && "justify-center"}`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                {isOpen && <span className={isActive ? "text-primary-foreground" : "text-foreground"}>{item.name}</span>}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="my-2 w-full h-[1px] bg-border"></div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 hover:bg-destructive/10 text-foreground ${!isOpen && "justify-center"
              }`}
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 text-muted-foreground" />
            {isOpen && <span className="text-foreground">Logout</span>}
          </button>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
