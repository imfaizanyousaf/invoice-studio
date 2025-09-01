"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import InvoiceAnalytics from "@/components/admin/invoice-analytics";
// import UserManagement from "@/components/admin/usermanagement";
// import SubscriptionPlans from "@/components/admin/SubscriptionPlans";


export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center">
      <InvoiceAnalytics/>
      
    </div>
  );
}