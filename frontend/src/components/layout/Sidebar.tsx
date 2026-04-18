'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  FlaskConical,
  PlayCircle,
  Bot,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const navItems = [
  { href: `${basePath}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
  { href: `${basePath}/projects`, label: 'Projects', icon: FolderOpen },
  { href: `${basePath}/tests`, label: 'Test Cases', icon: FlaskConical },
  { href: `${basePath}/executions`, label: 'Executions', icon: PlayCircle },
  { href: `${basePath}/ai-agent`, label: 'AI Agent', icon: Bot, badge: 'AI' },
  { href: `${basePath}/settings`, label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, user, logout } = useStore();

  const isActive = (href: string) => {
    const path = href.replace(basePath, '') || '/';
    const currentPath = pathname.replace(basePath, '') || '/';
    return currentPath === path || (path !== '/' && currentPath.startsWith(path));
  };

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-gray-950 border-r border-white/10 transition-all duration-300 sticky top-0',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">QA Platform</p>
              <p className="text-xs text-gray-500 truncate">Test Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                active
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <Icon
                className={cn(
                  'flex-shrink-0 w-5 h-5',
                  active ? 'text-violet-400' : 'text-gray-500 group-hover:text-gray-300'
                )}
              />
              {!sidebarCollapsed && (
                <>
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full bg-violet-500/30 text-violet-300 font-medium">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-gray-200 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-white/10">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-3 space-y-1">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5 mb-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-200 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200',
            sidebarCollapsed && 'justify-center'
          )}
        >
          <LogOut className="flex-shrink-0 w-4 h-4" />
          {!sidebarCollapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all duration-200',
            sidebarCollapsed && 'justify-center'
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
