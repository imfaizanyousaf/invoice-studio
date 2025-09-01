"use client";
import {
  EnvelopeIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";
import Link from "next/link";
import React, { useState } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";
import { signIn, useSession } from "next-auth/react";
import Notification from "@/components/dashboard/Notification";
import { toast } from "react-toastify";

const SignIn = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useUser();
  const [success, setSuccess] = useState("");

  const handleGoogleLogin = () => {
    toast.info('Logging in with Google...');
    setLoading(true);
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.post("/api/auth/login", formData);
      if (res.data.success) {
        const { token } = res.data;
        await login(token);
        setSuccess("Login successful!");
        setFormData({ email: "", password: "" });
        localStorage.setItem("type", "user");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      if (error.response?.status === 404) {
        setError("User not found. Please check your email.");
      } else if (error.response?.status === 401) {
        setError("Invalid password. Please try again.");
      } else {
        setError(error.response?.data?.message || "An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-4 pb-10 pt-[150px]">
      <div className="flex flex-col items-center gap-4 border-2 border-border bg-card rounded-3xl p-10 max-w-[600px] md:w-[700px] mx-auto">
        {success && (
          <Notification
            isOpen={true}
            onClose={() => setSuccess("")}
            title="Success"
            message={success}
            type="success"
          />
        )}

        {error && (
          <Notification
            isOpen={true}
            onClose={() => setError("")}
            title="Error"
            message={error}
            type="error"
          />
        )}

        <div
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center text-normal cursor-pointer hover:bg-muted transition-all border-2 border-border rounded-xl p-2 gap-2 disabled:cursor-not-allowed disabled:bg-muted"
        >
          <FontAwesomeIcon icon={faGoogle} className="w-5 h-5 text-muted-foreground" />
          <p className="text-foreground">Continue with Google</p>
        </div>

        <div className="flex items-center w-full gap-2">
          <div className="flex-1 h-[1px] bg-border"></div>
          <p className="text-muted-foreground text-sm whitespace-nowrap">
            Or continue with
          </p>
          <div className="flex-1 h-[1px] bg-border"></div>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 w-full">
          <div className="w-full flex items-center gap-3 border-2 border-border rounded-xl p-3 bg-transparent">
            <EnvelopeIcon className="w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onKeyDown={handleKeyDown}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none"
            />
          </div>

          <div className="w-full flex items-center gap-3 border-2 border-border rounded-xl p-3 bg-transparent">
            <LockClosedIcon className="w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onKeyDown={handleKeyDown}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none"
            />
            {!showPassword ? (
              <EyeSlashIcon
                className="w-5 h-5 text-muted-foreground cursor-pointer"
                onClick={() => setShowPassword(true)}
              />
            ) : (
              <EyeIcon
                className="w-5 h-5 text-muted-foreground cursor-pointer"
                onClick={() => setShowPassword(false)}
              />
            )}
          </div>

          <div className="flex items-center justify-end w-full">
            <Link href="/forgot-password" className="text-primary hover:underline text-sm">
              Forgot Password?
            </Link>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold cursor-pointer hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>
        </div>

        <div className="flex items-center justify-center w-full">
          <p className="text-foreground text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
