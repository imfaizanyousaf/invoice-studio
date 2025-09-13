"use client";
import React from "react";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import { ImageCountProvider } from "@/context/RequestCountContext";
import { PackageProvider } from "@/context/PackageContext";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  const { isOpen } = useSidebar();

  return (
    <div 
      className={`flex min-h-screen ${
        isOpen ? 'sidebar-width-expanded' : 'sidebar-width-collapsed'
      }`}
    >
      <Sidebar />
      <main className="main-content">
        <div className="p-6 w-full">
          <Header />
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