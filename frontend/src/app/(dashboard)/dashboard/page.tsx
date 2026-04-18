'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen, FlaskConical, PlayCircle, TrendingUp, Activity, GitBranch } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { DashboardStats, Execution } from '@/lib/types';
import { cn, formatRelativeTime, formatDuration, getStatusBg } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function ExecutionRow({ execution }: { execution: Execution }) {
  const passRate = execution.totalTests > 0
    ? Math.round((execution.passedTests / execution.totalTests) * 100)
    : 0;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-200 truncate">{execution.name}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {execution.branch && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <GitBranch className="w-3 h-3" />
              {execution.branch}
            </div>
          )}
          <span className="text-xs text-gray-500">{formatRelativeTime(execution.createdAt)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-gray-400">
            {execution.passedTests}/{execution.totalTests} passed
          </p>
          <div className="w-20 h-1.5 bg-gray-800 rounded-full mt-1">
            <div
              className={cn(
                'h-full rounded-full',
                passRate >= 90 ? 'bg-emerald-500' : passRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
              )}
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>
        <Badge className={cn('text-xs min-w-16 justify-center', getStatusBg(execution.status))}>
          {execution.status}
        </Badge>
        {execution.duration && (
          <span className="text-xs text-gray-500 w-12 text-right">{formatDuration(execution.duration)}</span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then(setStats).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 bg-white/5 rounded-lg animate-shimmer" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of your QA platform activity"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            subtitle="Active workspaces"
            icon={FolderOpen}
            color="violet"
            trend={{ value: 12, label: 'this month', positive: true }}
          />
          <StatsCard
            title="Test Cases"
            value={stats.totalTests}
            subtitle={`${stats.testsByStatus.active} active`}
            icon={FlaskConical}
            color="blue"
            trend={{ value: 8, label: 'new this week', positive: true }}
          />
          <StatsCard
            title="Executions"
            value={stats.totalExecutions}
            subtitle="Total runs"
            icon={PlayCircle}
            color="emerald"
            trend={{ value: 5, label: 'vs last week', positive: true }}
          />
          <StatsCard
            title="Pass Rate"
            value={`${stats.overallPassRate}%`}
            subtitle="All time average"
            icon={TrendingUp}
            color={stats.overallPassRate >= 90 ? 'emerald' : stats.overallPassRate >= 70 ? 'amber' : 'red'}
            trend={{ value: 2.3, label: 'improvement', positive: true }}
          />
        </div>

        {/* Charts and executions */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Execution trend chart */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-violet-400" />
                    Execution Trend (7 days)
                  </div>
                </CardTitle>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Passed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500" /> Failed
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.executionTrend}>
                  <defs>
                    <linearGradient id="passedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="passed" stroke="#10b981" fill="url(#passedGradient)" strokeWidth={2} />
                  <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#failedGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Test distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-300">Test Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'Active Tests', count: stats.testsByStatus.active, color: 'bg-emerald-500', pct: Math.round((stats.testsByStatus.active / stats.totalTests) * 100) },
                { label: 'Draft', count: stats.testsByStatus.draft, color: 'bg-amber-500', pct: Math.round((stats.testsByStatus.draft / stats.totalTests) * 100) },
                { label: 'Archived', count: stats.testsByStatus.archived, color: 'bg-gray-600', pct: Math.round((stats.testsByStatus.archived / stats.totalTests) * 100) },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-300 font-medium">{item.count} ({item.pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', item.color)}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t border-white/10 space-y-2">
                <p className="text-xs font-medium text-gray-400">Quick Stats</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-lg font-bold text-violet-400">
                      {stats.recentExecutions.filter(e => e.triggeredBy === 'ai').length}
                    </p>
                    <p className="text-xs text-gray-500">AI-triggered</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-lg font-bold text-blue-400">
                      {stats.recentExecutions.filter(e => e.triggeredBy === 'github').length}
                    </p>
                    <p className="text-xs text-gray-500">GitHub CI</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent executions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-300">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentExecutions.map((exec) => (
              <ExecutionRow key={exec.id} execution={exec} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
