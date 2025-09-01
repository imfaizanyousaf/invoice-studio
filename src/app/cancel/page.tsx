import React from "react";
import Link from "next/link";

const SuccessPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-destructive">Payment Failed!</h1>
      <Link href="/dashboard" className="text-muted-foreground mt-4 hover:text-primary transition-colors">Try again.</Link>
    </div>
  );
};

export default SuccessPage;