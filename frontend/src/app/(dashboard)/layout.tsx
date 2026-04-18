'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useStore } from '@/store/useStore';
import { USE_MOCK } from '@/lib/api';
import { MOCK_USER } from '@/lib/mock-data';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, setAuth, notifications } = useStore();

  useEffect(() => {
    if (USE_MOCK && !isAuthenticated) {
      setAuth(MOCK_USER, 'mock-token');
      return;
    }
    if (!isAuthenticated) {
      router.replace(`${basePath}/login`);
    }
  }, [isAuthenticated, router, setAuth]);

  if (!isAuthenticated && !USE_MOCK) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`
              flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-lg
              ${notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' : ''}
              ${notif.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-100' : ''}
              ${notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-100' : ''}
              ${notif.type === 'info' ? 'bg-blue-500/10 border-blue-500/30 text-blue-100' : ''}
            `}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{notif.title}</p>
              <p className="text-xs opacity-80 mt-0.5">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
