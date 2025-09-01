import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { UserProvider } from '@/context/UserContext';
import { SessionProvider } from "next-auth/react";
import Providers from './Providers';
import Navbar from '@/components/dashboard/Navbar';
import { PackageProvider } from '@/context/PackageContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Invoice Insights',
  description: 'Extract data from invoices with AI',
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            
            <UserProvider>   {/* ✅ Then wrap your custom UserProvider */}
              <PackageProvider>
              <Navbar/>
              {children}
              </PackageProvider>
            </UserProvider>
          </Providers>

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
