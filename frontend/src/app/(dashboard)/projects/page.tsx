'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen, GitBranch, FlaskConical, TrendingUp, MoreVertical, Globe } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { Project } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { cn, formatRelativeTime, getStatusBg } from '@/lib/utils';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function ProjectCard({ project }: { project: Project }) {
  const passRate = project.passRate || 0;

  return (
    <Link href={`${basePath}/projects/${project.id}`}>
      <div className="group relative bg-gray-900/50 border border-white/10 rounded-xl p-6 hover:border-violet-500/30 hover:bg-gray-900/80 transition-all duration-200 cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 rounded-lg flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-100 group-hover:text-white transition-colors">
                {project.name}
              </h3>
              <Badge className={cn('text-xs mt-1', getStatusBg(project.status))}>
                {project.status}
              </Badge>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-300 transition-all p-1">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4 line-clamp-2">{project.description}</p>

        {project.baseUrl && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <Globe className="w-3.5 h-3.5" />
            <span className="truncate">{project.baseUrl}</span>
          </div>
        )}

        {project.githubRepo && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{project.githubRepo}</span>
            {project.githubBranch && (
              <span className="text-gray-600">({project.githubBranch})</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>{project.testCount} tests</span>
            </div>
            {project.passRate !== undefined && (
              <div className="flex items-center gap-1.5 text-xs">
                <TrendingUp
                  className={cn(
                    'w-3.5 h-3.5',
                    passRate >= 90 ? 'text-emerald-400' : passRate >= 70 ? 'text-amber-400' : 'text-red-400'
                  )}
                />
                <span
                  className={cn(
                    passRate >= 90 ? 'text-emerald-400' : passRate >= 70 ? 'text-amber-400' : 'text-red-400'
                  )}
                >
                  {passRate}%
                </span>
              </div>
            )}
          </div>
          {project.lastRunAt && (
            <span className="text-xs text-gray-600">{formatRelativeTime(project.lastRunAt)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CreateProjectDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}) {
  const [form, setForm] = useState({ name: '', description: '', baseUrl: '', githubRepo: '' });
  const [loading, setLoading] = useState(false);
  const { addNotification } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await api.createProject(form);
      addNotification({ type: 'success', title: 'Project created!', message: `${project.name} is ready.` });
      onCreated(project);
      onClose();
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to create project.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Add a new QA project to your workspace</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Project Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="My Web Application"
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What does this project test?"
              rows={3}
              className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 resize-none"
            />
          </div>
          <Input
            label="Base URL (optional)"
            value={form.baseUrl}
            onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
            placeholder="https://myapp.com"
          />
          <Input
            label="GitHub Repo (optional)"
            value={form.githubRepo}
            onChange={(e) => setForm({ ...form, githubRepo: e.target.value })}
            placeholder="owner/repo-name"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    api.getProjects().then(setProjects).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Header
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} in your workspace`}
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        }
      />

      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-xl animate-shimmer" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24">
            <FolderOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project to start writing tests.</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(p) => setProjects((prev) => [...prev, p])}
      />
    </div>
  );
}
