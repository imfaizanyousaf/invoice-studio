"use client";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import React, { useState, useEffect, Suspense } from "react";
import Notification from "@/components/dashboard/Notification";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

const ResetPasswordContent = () => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing token. Please try again.");
    }
  }, [token]);

  const handleSubmit = async () => {
    if (!password) {
      setError("Please enter your new password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Password reset successfully! Redirecting to sign-in...");
        setTimeout(() => router.push("/signin"), 3000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error resetting password:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-4 pb-10 pt-[150px]">
      <div className="flex flex-col items-center gap-4 border-2 border-border bg-card rounded-3xl p-10 max-w-[600px] md:w-[700px] mx-auto">
        <h1 className="text-2xl font-bold text-center text-foreground">Reset Password</h1>

        {success && (
          <Notification
            isOpen={true}
            onClose={() => setSuccess(false)}
            title="Success"
            message={success}
            type="success"
            link="/signin"
          />
        )}

        {error && (
          <Notification
            isOpen={true}
            onClose={() => setError(false)}
            title="Error"
            message={error}
            type="error"
          />
        )}

        <div className="flex flex-col items-center justify-center gap-6 w-full mx-auto">
          <div className="w-full flex items-center gap-3 border-2 border-border rounded-xl p-3 bg-transparent">
            <EnvelopeIcon className="w-5 h-5 text-muted-foreground" />
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onKeyDown={handleKeyDown}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "setting Password..." : "set Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ResetPassword = () => {
  return (
    
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    
  );
};

export default ResetPassword;