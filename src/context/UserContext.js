"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
// import { ADMIN_EMAILS } from "@/lib/constants";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const router = useRouter();
  const { data: session, status } = useSession();

  const validateAndDecodeToken = (token) => {
    if (!token || typeof token !== 'string') throw new Error('Invalid token');
    try {
      return jwtDecode(token.trim());
    } catch (error) {
      throw new Error('Invalid authentication token');
    }
  };

  useEffect(() => {
    const handleAuth = async () => {
      try {
        setAuthError(null);
        if (status === 'loading') return;

        if (session?.customToken) {
          const decodedUser = validateAndDecodeToken(session.customToken);
          setUser(decodedUser);
          localStorage.setItem('token', session.customToken);
        } else if (session?.user) {
          setUser({
            userId: session.user.id,
            _id: session.user._id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
            provider: session.user.provider
          });
        } else {
          const token = localStorage.getItem('token');
          if (token) {
            const decodedUser = validateAndDecodeToken(token);
            setUser(decodedUser);
          } else {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[Auth] Error:', error);
        setAuthError(error.message);
        await logout();
      }
    };

    handleAuth();
  }, [session, status]);

  // ✅ Admin/user redirection AFTER user is set
  useEffect(() => {
    if (!user?.email) return;

    const normalizedEmail = user.email.trim().toLowerCase();
    const isAdmin = user.role== "admin";

    const currentPath = window.location.pathname;
    if (user.role == "admin" && currentPath !== "/admin-dashboard") {
      router.push("/admin-dashboard");
    } else if (user.role != "admin" && currentPath !== "/dashboard") {
      router.push("/dashboard");
    }
  }, [user]);

  const login = async (token) => {
    try {
      const decodedUser = validateAndDecodeToken(token);
      localStorage.setItem('token', token);
      setUser(decodedUser); // ⛔️ Don't redirect here, let useEffect handle it
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setAuthError(null);

    try {
      if (session) {
        await signOut({ redirect: false });
      }
      router.push('/signin');
    } catch {
      router.push('/signin');
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, authError, setAuthError }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
