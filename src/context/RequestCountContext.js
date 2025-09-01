"use client";
import { createContext, useState, useContext, useEffect } from "react";
import { useUser } from "./UserContext";
import axios from "axios";

const ImageCountContext = createContext();

export const ImageCountProvider = ({ children }) => {
  const [imageCount, setImageCount] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    
    const fetchImageCount = async () => {
      try {
        const userId = user?.userId || user._id;
        const res = await axios.get(`/api/packages/${userId}`);
        
        
        setImageCount(res.data.images);

      } catch (error) {
        console.error("Error fetching image count:", error);
        setImageCount(5); // Fallback count
      }
    };

    fetchImageCount();
  }, [user]);

  return (
    <ImageCountContext.Provider value={{ imageCount, setImageCount }}>
      {children}
    </ImageCountContext.Provider>
  );
};

// Always export the hook with proper error handling
export const useImageCount = () => {
  const context = useContext(ImageCountContext);
  if (!context) {
    throw new Error('useImageCount must be used within an ImageCountProvider');
  }
  return context;
};