"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ImageCountProvider } from "@/context/RequestCountContext";
import { PackageProvider } from "@/context/PackageContext";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";


const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if(user){
      if (user?.role !== "admin") {
      router.push("/not-authorized");
    }
    } else{
      router.push("/signin")
    }
    
    
  }, [user, router]);

  

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main
        className={`flex-1 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-16"
        }`}
      >
        <div className="p-6">
          {/* <Header /> */}
          {children}
        </div>
      </main>
    </div>
  );
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ImageCountProvider>
        <PackageProvider>
          <LayoutContent>{children}</LayoutContent>
        </PackageProvider>
      </ImageCountProvider>
    </SidebarProvider>
  );
}