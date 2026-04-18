import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remainSecs = secs % 60;
  if (mins < 60) return `${mins}m ${remainSecs}s`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    passed: 'text-emerald-400',
    failed: 'text-red-400',
    error: 'text-red-400',
    running: 'text-blue-400',
    pending: 'text-amber-400',
    skipped: 'text-gray-400',
    cancelled: 'text-gray-400',
    active: 'text-emerald-400',
    draft: 'text-gray-400',
    archived: 'text-gray-500',
    critical: 'text-red-400',
    high: 'text-orange-400',
    medium: 'text-amber-400',
    low: 'text-blue-400',
  };
  return colors[status.toLowerCase()] || 'text-gray-400';
}

export function getStatusBg(status: string): string {
  const colors: Record<string, string> = {
    passed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    skipped: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };
  return colors[status.toLowerCase()] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}
