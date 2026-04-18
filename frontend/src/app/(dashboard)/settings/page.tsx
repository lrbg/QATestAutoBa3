'use client';

import React, { useEffect, useState } from 'react';
import {
  Github,
  Key,
  Bell,
  Globe,
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  GitBranch,
  Webhook,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { Project, GitHubConfig } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [githubConfig, setGithubConfig] = useState<GitHubConfig | null>(null);
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [branches, setBranches] = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const { addNotification, user } = useStore();

  useEffect(() => {
    api.getProjects().then((p) => {
      setProjects(p);
      if (p.length > 0) setSelectedProjectId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProjectId) return;
    api.getGitHubConfig(selectedProjectId).then(setGithubConfig);
  }, [selectedProjectId]);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const config = await api.connectGitHub(selectedProjectId, repoOwner, repoName);
      setGithubConfig(config);
      addNotification({ type: 'success', title: 'GitHub Connected!', message: `${repoOwner}/${repoName}` });
    } catch {
      addNotification({ type: 'error', title: 'Connection failed', message: 'Check your credentials and try again.' });
    } finally {
      setConnecting(false);
    }
  };

  const handleLoadBranches = async () => {
    if (!selectedProjectId) return;
    setLoadingBranches(true);
    try {
      const b = await api.getGitHubBranches(selectedProjectId);
      setBranches(b);
    } finally {
      setLoadingBranches(false);
    }
  };

  return (
    <div>
      <Header title="Settings" subtitle="Configure your workspace and integrations" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Shield className="w-4 h-4 text-violet-400" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-200">{user?.name}</p>
                <p className="text-sm text-gray-400">{user?.email}</p>
                <Badge className="mt-1 text-xs bg-violet-500/20 text-violet-300 border-violet-500/30">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GitHub Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Github className="w-4 h-4 text-gray-300" />
              GitHub Integration
            </CardTitle>
            <CardDescription>
              Connect a GitHub repository to trigger tests on push and pull requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-10 rounded-md border border-white/10 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {githubConfig?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-300">Connected to GitHub</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {githubConfig.repoOwner}/{githubConfig.repoName}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-400">
                    <ExternalLink className="w-4 h-4 mr-1.5" />
                    Open
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-gray-500 mb-1">Default Branch</p>
                    <div className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-gray-300">{githubConfig.defaultBranch}</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <p className="text-gray-500 mb-1">Webhook</p>
                    <div className="flex items-center gap-1.5">
                      <Webhook className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-gray-300">
                        {githubConfig.webhookId ? 'Active' : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadBranches}
                    loading={loadingBranches}
                  >
                    <GitBranch className="w-4 h-4 mr-2" />
                    Load Branches
                  </Button>
                  {branches.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {branches.map((b) => (
                        <span
                          key={b}
                          className="text-xs px-2 py-1 bg-white/5 border border-white/10 rounded text-gray-400"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">
                    Connect your GitHub repository to enable CI/CD integration and automatic test runs.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Repository Owner"
                    value={repoOwner}
                    onChange={(e) => setRepoOwner(e.target.value)}
                    placeholder="owner-name"
                    required
                  />
                  <Input
                    label="Repository Name"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="repo-name"
                    required
                  />
                </div>
                <Button type="submit" loading={connecting} className="w-full">
                  <Github className="w-4 h-4 mr-2" />
                  Connect Repository
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Key className="w-4 h-4 text-amber-400" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure the Claude API key for AI test generation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">Anthropic API Key</p>
                <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                  Configured
                </Badge>
              </div>
              <Input
                type="password"
                value="sk-ant-••••••••••••••••••••••••••••••"
                readOnly
                helperText="Set via ANTHROPIC_API_KEY environment variable"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">GitHub Personal Access Token</p>
                <Badge className="text-xs bg-amber-500/20 text-amber-300 border-amber-500/30">
                  Optional
                </Badge>
              </div>
              <Input
                type="password"
                placeholder="ghp_••••••••••••••••"
                helperText="Required for private repositories"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Bell className="w-4 h-4 text-blue-400" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Test execution completed', enabled: true },
                { label: 'Tests failing in CI', enabled: true },
                { label: 'AI generated new tests', enabled: false },
                { label: 'GitHub webhook triggered', enabled: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <p className="text-sm text-gray-300">{item.label}</p>
                  <div
                    className={cn(
                      'w-10 h-5 rounded-full relative cursor-pointer transition-colors',
                      item.enabled ? 'bg-violet-500' : 'bg-gray-700'
                    )}
                  >
                    <div
                      className={cn(
                        'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all',
                        item.enabled ? 'right-0.5' : 'left-0.5'
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
