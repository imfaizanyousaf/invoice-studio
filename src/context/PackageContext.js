"use client"
import axios from "axios";
import React, { createContext, useContext, useState, useCallback } from "react";

const PackageContext = createContext();

export const PackageProvider = ({ children }) => {
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [userPackage, setUserPackage] = useState(null);
    const [loading, setLoading] = useState(false);

    const savePackage = async (packageData) => {
        try {
            // Save the package to the database
            const response = await fetch("/api/packages/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(packageData),
            });

            if (!response.ok) {
                throw new Error("Failed to save package");
            }

            const data = await response.json();
            console.log("Package saved:", data);
            setSelectedPackage(data); 
        } catch (error) {
            console.error("Error saving package:", error);
        }
    };

    const getPackage = useCallback(async (userId) => {
        // If we already have the package data for this user, return it
        if (userPackage && userPackage.UserId === userId) {
            return userPackage;
        }

        setLoading(true);
        try {
            const response = await axios.get(`/api/packages/${userId}`);
            const data = await response.data;
            setUserPackage(data);
            setLoading(false);
            return data;
        } catch (error) {
            console.error("Error fetching package:", error);
            setLoading(false);
            throw error;
        }
    }, [userPackage]);

    const updatePackageRequests = useCallback(async (userId, newRequestCount) => {
        try {
            const response = await axios.patch(`/api/packages/update-count`, {
                userId,
                requests: newRequestCount
            });
            const updatedPackage = await response.data;
            setUserPackage(updatedPackage);
            return updatedPackage;
        } catch (error) {
            console.error("Error updating package requests:", error);
            throw error;
        }
    }, []);

    return (
        <PackageContext.Provider value={{ 
            selectedPackage, 
            userPackage,
            savePackage, 
            getPackage, 
            updatePackageRequests,
            loading 
        }}>
            {children}
        </PackageContext.Provider>
    );
};

export const usePackage = () => useContext(PackageContext);