import { StopIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React from "react";

interface NotificationProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  link?: string | null;
  type?: "success" | "error";
}

const Notification = ({
  isOpen,
  onClose,
  title,
  message,
  link = null,
  type = "success",
}: NotificationProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center font-onest z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="bg-card text-foreground border border-border rounded-3xl p-8 max-w-sm w-full mx-4 relative z-10">
        <div className="flex flex-col items-center text-center">
          {/* Success Icon */}
          

          {/* Error Icon */}
          {/* {type === "error" && (
            <div className="relative w-20 h-20 flex items-center justify-center mb-6">
              <img src="/notification.png" alt="Error Icon" className="w-full h-full" />
              <div className="absolute top-0 right-0 p-2">
                <StopIcon className="w-full h-full text-destructive" />

              </div>
            </div>
          )} */}

          {/* Title */}
          <h2 className="text-2xl font-bold mb-2 font-onest">{title}</h2>

          {/* Message */}
          <p className="mb-8 font-sans text-muted-foreground">{message}</p>

          {/* Continue Button (if link is provided) */}
          {link && (
            <Link
              href={link}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground cursor-pointer py-3 rounded-lg font-medium hover:opacity-90 transition-all"
            >
              Continue
            </Link>
          )}

          {/* Close Button */}
          {!link && (
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground cursor-pointer py-3 rounded-lg font-medium hover:opacity-90 transition-all"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;