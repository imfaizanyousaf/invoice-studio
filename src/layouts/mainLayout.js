"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BadgeSection from "@/components/BadgeSection";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Background Grid Layer */}
      <div className="fixed inset-0 z-0">
        <img
          src="/Background_Grid1.png"
          alt="Background Grid"
          className="w-full h-full object-cover "
        />
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <Navbar />
        {children}
        <BadgeSection />
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;
