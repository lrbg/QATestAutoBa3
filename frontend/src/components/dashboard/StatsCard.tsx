import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  color?: 'violet' | 'blue' | 'emerald' | 'amber' | 'red';
  className?: string;
}

const colorMap = {
  violet: {
    icon: 'bg-violet-500/20 text-violet-400',
    gradient: 'from-violet-500/10',
    border: 'border-violet-500/20',
    trend: 'text-violet-400',
  },
  blue: {
    icon: 'bg-blue-500/20 text-blue-400',
    gradient: 'from-blue-500/10',
    border: 'border-blue-500/20',
    trend: 'text-blue-400',
  },
  emerald: {
    icon: 'bg-emerald-500/20 text-emerald-400',
    gradient: 'from-emerald-500/10',
    border: 'border-emerald-500/20',
    trend: 'text-emerald-400',
  },
  amber: {
    icon: 'bg-amber-500/20 text-amber-400',
    gradient: 'from-amber-500/10',
    border: 'border-amber-500/20',
    trend: 'text-amber-400',
  },
  red: {
    icon: 'bg-red-500/20 text-red-400',
    gradient: 'from-red-500/10',
    border: 'border-red-500/20',
    trend: 'text-red-400',
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'violet',
  className,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br to-transparent p-6',
        `bg-gray-900/50 ${colors.gradient} ${colors.border}`,
        className
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          'absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 blur-2xl',
          color === 'violet' && 'bg-violet-500',
          color === 'blue' && 'bg-blue-500',
          color === 'emerald' && 'bg-emerald-500',
          color === 'amber' && 'bg-amber-500',
          color === 'red' && 'bg-red-500'
        )}
      />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                'text-xs font-medium',
                trend.positive !== false ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.value > 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>

        <div className={cn('p-3 rounded-xl', colors.icon)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
