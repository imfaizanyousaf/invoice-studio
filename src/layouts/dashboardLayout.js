"use client";

import React from "react";
import Sidebar from "../components/dashboard/Sidebar";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";
import Navbar from "@/components/dashboard/Navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MainContent = ({ children }) => {
  const { isOpen } = useSidebar();

  return (
    <main
      className={`flex-1 min-h-screen transition-all duration-300 ${
        isOpen ? "md:ml-64" : "md:ml-16"
      }`}
    >
      <div className="p-6">
        <Navbar />
        {children}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          closeOnClick
          pauseOnHover
        />
      </div>
    </main>
  );
};


const DashboardLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
