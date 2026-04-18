'use client';

import React from 'react';
import { Bell, Search, Sun, Moon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const { theme, setTheme, notifications } = useStore();
  const unreadCount = notifications.length;

  return (
    <header className="h-16 border-b border-white/10 bg-gray-950/50 backdrop-blur-md sticky top-0 z-40 flex items-center px-6 gap-4">
      {/* Title area */}
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-lg font-semibold text-gray-100 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* Search */}
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-200">
          <Search className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-200 relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full" />
          )}
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-gray-400 hover:text-gray-200"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>
    </header>
  );
}
