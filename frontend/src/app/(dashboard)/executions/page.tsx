'use client';

import React, { useEffect, useState } from 'react';
import {
  PlayCircle,
  CheckCircle,
  XCircle,
  Clock,
  GitBranch,
  User,
  Bot,
  Calendar,
  ChevronDown,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TestResultView } from '@/components/tests/TestResultView';
import { api } from '@/lib/api';
import { Execution, Project } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { cn, formatRelativeTime, formatDuration, getStatusBg } from '@/lib/utils';

function TriggerIcon({ trigger }: { trigger: Execution['triggeredBy'] }) {
  const icons = {
    manual: <User className="w-3.5 h-3.5" />,
    github: <GitBranch className="w-3.5 h-3.5" />,
    scheduled: <Calendar className="w-3.5 h-3.5" />,
    ai: <Bot className="w-3.5 h-3.5" />,
  };
  return icons[trigger] || null;
}

function ExecutionCard({
  execution,
}: {
  execution: Execution;
}) {
  const [expanded, setExpanded] = useState(false);
  const passRate = execution.totalTests > 0
    ? Math.round((execution.passedTests / execution.totalTests) * 100)
    : 0;

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden bg-gray-900/50">
      <button
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Status icon */}
        <div className="flex-shrink-0">
          {execution.status === 'passed' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
          {execution.status === 'failed' && <XCircle className="w-5 h-5 text-red-400" />}
          {execution.status === 'running' && <PlayCircle className="w-5 h-5 text-blue-400 animate-pulse" />}
          {execution.status === 'pending' && <Clock className="w-5 h-5 text-amber-400" />}
          {execution.status === 'cancelled' && <Clock className="w-5 h-5 text-gray-400" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200">{execution.name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <TriggerIcon trigger={execution.triggeredBy} />
              <span className="capitalize">{execution.triggeredBy}</span>
            </div>
            {execution.branch && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <GitBranch className="w-3 h-3" />
                {execution.branch}
              </div>
            )}
            <span className="text-xs text-gray-600">
              {formatRelativeTime(execution.createdAt)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">
              {execution.passedTests}/{execution.totalTests}
            </p>
            <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1">
              <div
                className={cn(
                  'h-full rounded-full',
                  passRate >= 90 ? 'bg-emerald-500' : passRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${passRate}%` }}
              />
            </div>
          </div>

          {execution.duration && (
            <span className="text-xs text-gray-500 hidden md:block w-12 text-right">
              {formatDuration(execution.duration)}
            </span>
          )}

          <Badge className={cn('text-xs min-w-16 justify-center', getStatusBg(execution.status))}>
            {execution.status}
          </Badge>

          {expanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {expanded && execution.results.length > 0 && (
        <div className="border-t border-white/10 bg-gray-950/30 p-4">
          <TestResultView results={execution.results} />
        </div>
      )}

      {expanded && execution.results.length === 0 && (
        <div className="border-t border-white/10 bg-gray-950/30 p-4">
          <div className="text-center py-8 text-gray-500 text-sm">
            {execution.status === 'running' ? (
              <div className="flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>Execution in progress...</span>
              </div>
            ) : execution.status === 'pending' ? (
              'Waiting to start...'
            ) : (
              'No detailed results available'
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [triggering, setTriggering] = useState(false);
  const { addNotification } = useStore();

  useEffect(() => {
    Promise.all([api.getExecutions(), api.getProjects()])
      .then(([ex, p]) => { setExecutions(ex); setProjects(p); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = executions.filter((ex) => {
    const matchProject = !filterProject || ex.projectId === filterProject;
    const matchStatus = !filterStatus || ex.status === filterStatus;
    return matchProject && matchStatus;
  });

  const handleTrigger = async () => {
    if (!projects[0]) return;
    setTriggering(true);
    try {
      const exec = await api.triggerExecution({ projectId: filterProject || projects[0].id });
      setExecutions((prev) => [exec, ...prev]);
      addNotification({ type: 'success', title: 'Execution started!', message: exec.name });
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to trigger execution.' });
    } finally {
      setTriggering(false);
    }
  };

  const runningCount = executions.filter((e) => e.status === 'running').length;
  const passedToday = executions.filter((e) => e.status === 'passed').length;
  const failedToday = executions.filter((e) => e.status === 'failed').length;

  return (
    <div>
      <Header
        title="Executions"
        subtitle="Test run history and results"
        actions={
          <Button size="sm" loading={triggering} onClick={handleTrigger}>
            <Play className="w-4 h-4 mr-2" />
            Run Tests
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{runningCount}</p>
                <p className="text-xs text-gray-500">Running now</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{passedToday}</p>
                <p className="text-xs text-gray-500">Passed</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-4 h-4 text-red-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{failedToday}</p>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="h-10 rounded-md border border-white/10 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-10 rounded-md border border-white/10 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="running">Running</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Executions list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <PlayCircle className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No executions yet</h3>
            <p className="text-gray-500 mb-6">Run your first test suite to see results here.</p>
            <Button onClick={handleTrigger} loading={triggering}>
              <Play className="w-4 h-4 mr-2" />
              Start First Run
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((exec) => (
              <ExecutionCard key={exec.id} execution={exec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
