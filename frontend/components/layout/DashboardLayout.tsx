'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { WifiIcon } from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading, isOffline } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect to login when:
    // 1. Auth has finished loading (isLoading = false)
    // 2. The user is genuinely not authenticated (no token/user in storage)
    // 3. The device is ONLINE — never redirect while offline because the
    //    session may still be valid but API calls are failing due to no network.
    if (!isLoading && !isAuthenticated && !isOffline) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, isOffline, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 animate-pulse">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl animate-spin"></div>
          </div>
          <p className="text-white/80 text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // While offline and not authenticated: show a holding screen instead of
  // redirecting to login — the session may still be valid once reconnected.
  if (!isAuthenticated && isOffline) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 text-center max-w-md w-full">
          <WifiIcon className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">You are offline</h2>
          <p className="text-white/70 text-sm">
            Please reconnect to the internet to continue. Your session will be restored automatically.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Sidebar */}
      <Sidebar role={user.role as any} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Offline banner — shown at the very top when disconnected */}
        {isOffline && (
          <div className="bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center justify-center gap-2 z-50 shrink-0">
            <WifiIcon className="w-4 h-4 shrink-0" />
            <span>No internet connection. Some features may not work until you reconnect.</span>
          </div>
        )}

        {/* Header */}
        <Header title={title} subtitle={subtitle} />

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
