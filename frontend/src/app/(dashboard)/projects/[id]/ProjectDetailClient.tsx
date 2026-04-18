'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FlaskConical,
  PlayCircle,
  GitBranch,
  Globe,
  Settings,
  Plus,
  Play,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Project, TestCase, Execution } from '@/lib/types';
import { cn, formatRelativeTime, formatDuration, getStatusBg } from '@/lib/utils';
import { useStore } from '@/store/useStore';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function ProjectDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const { addNotification } = useStore();

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getProject(id),
      api.getTestCases(id),
      api.getExecutions(id),
    ]).then(([p, tc, ex]) => {
      setProject(p);
      setTestCases(tc);
      setExecutions(ex);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleRunTests = async () => {
    if (!project) return;
    setTriggering(true);
    try {
      const execution = await api.triggerExecution({ projectId: project.id });
      setExecutions((prev) => [execution, ...prev]);
      addNotification({ type: 'success', title: 'Tests started!', message: 'Execution is now running.' });
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to start execution.' });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-24 bg-white/5 rounded-xl animate-shimmer" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white/5 rounded-xl animate-shimmer" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-400">Project not found</p>
      </div>
    );
  }

  const passRate = project.passRate || 0;

  return (
    <div>
      <Header
        title={project.name}
        subtitle={project.description}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`${basePath}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button size="sm" loading={triggering} onClick={handleRunTests}>
              <Play className="w-4 h-4 mr-2" />
              Run All Tests
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link
          href={`${basePath}/projects`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>

        {/* Project info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Tests', value: project.testCount, icon: FlaskConical, color: 'text-violet-400' },
            { label: 'Pass Rate', value: `${passRate}%`, icon: PlayCircle, color: passRate >= 90 ? 'text-emerald-400' : 'text-amber-400' },
            { label: 'Branch', value: project.githubBranch || 'N/A', icon: GitBranch, color: 'text-blue-400' },
            { label: 'Last Run', value: project.lastRunAt ? formatRelativeTime(project.lastRunAt) : 'Never', icon: PlayCircle, color: 'text-gray-400' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={cn('w-5 h-5', stat.color)} />
                  <div>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                    <p className="text-sm font-semibold text-gray-200">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Cases and Executions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Test Cases */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">Test Cases</CardTitle>
                <Link href={`${basePath}/tests`}>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Test
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {testCases.slice(0, 5).map((tc) => (
                  <div
                    key={tc.id}
                    className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                        tc.lastResult === 'passed' ? 'bg-emerald-400' :
                        tc.lastResult === 'failed' ? 'bg-red-400' : 'bg-gray-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{tc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={cn('text-xs', getStatusBg(tc.priority))}>
                          {tc.priority}
                        </Badge>
                        {tc.generatedByAI && (
                          <span className="text-xs text-violet-400">AI</span>
                        )}
                      </div>
                    </div>
                    {tc.lastRunAt && (
                      <span className="text-xs text-gray-600 flex-shrink-0">
                        {formatRelativeTime(tc.lastRunAt)}
                      </span>
                    )}
                  </div>
                ))}
                {testCases.length > 5 && (
                  <p className="text-xs text-gray-500 text-center pt-2">
                    +{testCases.length - 5} more test cases
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">Recent Executions</CardTitle>
                <Link href={`${basePath}/executions`}>
                  <Button variant="ghost" size="sm" className="text-xs text-gray-400">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {executions.slice(0, 5).map((exec) => (
                  <div
                    key={exec.id}
                    className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 truncate">{exec.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {exec.passedTests}/{exec.totalTests} passed
                        {exec.duration && ` · ${formatDuration(exec.duration)}`}
                      </p>
                    </div>
                    <Badge className={cn('text-xs', getStatusBg(exec.status))}>
                      {exec.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GitHub info */}
        {project.githubRepo && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    Connected to GitHub
                  </p>
                  <p className="text-xs text-gray-500">
                    {project.githubRepo} · {project.githubBranch || 'main'} branch
                  </p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
