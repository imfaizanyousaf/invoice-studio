'use client'

import { useUser } from '@/context/UserContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && status !== 'loading') {
      router.push('/signin');
    }
  }, [user, loading, status, router]);

  if (loading || status === 'loading') {
    return <div className='flex justify-center items-center h-screen bg-[#000]'><span className="loading loading-dots loading-lg"></span></div>;
  }

  if (!user) {
    return null; // or redirecting message
  }

  return children;
}