"use client"
import Link from "next/link";
import React, { useEffect } from "react";
import { usePackage } from "@/context/PackageContext";

const SuccessPage = () => {
    const { selectedPackage } = usePackage();

    useEffect(() => {
        if (selectedPackage) {
            console.log("Selected package:", selectedPackage);
        }
    }, [selectedPackage]);

    

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold text-green-600">Payment Successful!</h1>
            <p className="text-muted-foreground mt-4">Thank you for your purchase.</p>
            {selectedPackage && (
                <p className="text-muted-foreground mt-2">
                    You have purchased the <strong className="text-foreground">{selectedPackage.name}</strong> package.
                </p>
            )}
            <Link
                href={"/dashboard"}
                className="mt-8 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
                Go to Dashboard
            </Link>
        </div>
    );
};

export default SuccessPage;