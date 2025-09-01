// Create a separate file: admin-dashboard/AdminDashboard.tsx
"use client";
import React, { useEffect, useState } from "react";
import dynamic from 'next/dynamic';

// Import Sidebar normally if it doesn't use useSearchParams
import Sidebar from "@/components/admin/Sidebar";

// Dynamically import all other components to prevent SSR issues
const InvoiceAnalytics = dynamic(() => import("@/components/admin/invoice-analytics"), { 
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading Analytics...</div>
});

const UserManagement = dynamic(() => import("@/components/admin/usermanagement"), { 
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading Users...</div>
});

const SubscriptionPlans = dynamic(() => import("@/components/admin/SubscriptionPlans"), { 
  ssr: false,
  loading: () => <div className="p-8 text-center">Loading Plans...</div>
});

export default function AdminDashboard() {
  const [view, setView] = useState<"home" | "users" | "plans">("home");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get view from URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const viewParam = urlParams.get('view');
      
      if (viewParam === 'users') {
        setView('users');
      } else if (viewParam === 'plans') {
        setView('plans');
      } else {
        setView('home');
      }
    }
  }, []);

  // Don't render until mounted on client
  if (!mounted) {
    return (
      <div className="min-h-screen flex">
        <div className="w-64 bg-gray-50 border-r">
          <div className="p-6 animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300">
        <div className="container mx-auto p-4 md:p-8 space-y-6">
          {view === "home" && (
            <section className="mt-4">
              <InvoiceAnalytics invoices={[]} />
            </section>
          )}
          
          {view === "users" && (
            <section className="mt-4">
              <UserManagement />
            </section>
          )}
          
          {view === "plans" && (
            <section className="mt-4">
              <SubscriptionPlans />
            </section>
          )}
        </div>
        
        <footer className="text-center py-10 text-muted-foreground text-base mt-auto">
          <p>
            &copy; {new Date().getFullYear()} Invoice Insights. AI-Powered Data
            Extraction.
          </p>
        </footer>
      </div>
    </div>
  );
}