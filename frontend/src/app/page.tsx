'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(`${basePath}/dashboard`);
    } else {
      router.replace(`${basePath}/login`);
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
