'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  FlaskConical,
  Pencil,
  Trash2,
  Play,
  Search,
  Filter,
  Sparkles,
  Code,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TestCaseForm } from '@/components/tests/TestCaseForm';
import { api } from '@/lib/api';
import { TestCase, Project } from '@/lib/types';
import { useStore } from '@/store/useStore';
import { cn, formatRelativeTime, getStatusBg } from '@/lib/utils';

function TestCaseRow({
  testCase,
  onEdit,
  onDelete,
  onRun,
}: {
  testCase: TestCase;
  onEdit: () => void;
  onDelete: () => void;
  onRun: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-gray-900/50">
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
        <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-300">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div
          className={cn(
            'w-2 h-2 rounded-full flex-shrink-0',
            testCase.lastResult === 'passed' ? 'bg-emerald-400' :
            testCase.lastResult === 'failed' ? 'bg-red-400' : 'bg-gray-600'
          )}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-200 truncate">{testCase.name}</p>
            {testCase.generatedByAI && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 flex-shrink-0">
                AI
              </span>
            )}
            {testCase.playwrightCode && (
              <Code className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={cn('text-xs', getStatusBg(testCase.priority))}>
              {testCase.priority}
            </Badge>
            <Badge className={cn('text-xs', getStatusBg(testCase.status))}>
              {testCase.status}
            </Badge>
            {testCase.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {testCase.lastRunAt && (
            <span className="text-xs text-gray-500 hidden md:block">
              {formatRelativeTime(testCase.lastRunAt)}
            </span>
          )}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onRun} className="h-7 w-7 text-gray-400 hover:text-emerald-400">
              <Play className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-gray-400 hover:text-blue-400">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-7 w-7 text-gray-400 hover:text-red-400">
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 bg-gray-950/50 p-4 space-y-4">
          {testCase.description && (
            <p className="text-sm text-gray-400">{testCase.description}</p>
          )}

          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Steps ({testCase.steps.length})</p>
            <div className="space-y-1">
              {testCase.steps.map((step) => (
                <div key={step.id} className="flex items-start gap-3 text-xs text-gray-400">
                  <span className="w-5 h-5 rounded bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 flex-shrink-0">
                    {step.order}
                  </span>
                  <span className="font-mono text-violet-300">{step.action}</span>
                  {(step.selector || step.value) && (
                    <span className="font-mono text-gray-300">{step.selector || step.value}</span>
                  )}
                  {step.expectedResult && (
                    <span className="text-gray-600 ml-auto">{step.expectedResult}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {testCase.playwrightCode && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Playwright Code</p>
              <pre className="text-xs font-mono text-gray-300 bg-gray-950 rounded-lg p-3 overflow-x-auto border border-white/10">
                {testCase.playwrightCode}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function TestsPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingTest, setEditingTest] = useState<TestCase | null>(null);
  const [saving, setSaving] = useState(false);
  const { addNotification } = useStore();

  useEffect(() => {
    Promise.all([api.getTestCases(), api.getProjects()])
      .then(([tc, p]) => { setTestCases(tc); setProjects(p); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = testCases.filter((tc) => {
    const matchSearch = !search ||
      tc.name.toLowerCase().includes(search.toLowerCase()) ||
      tc.tags.some((t) => t.includes(search.toLowerCase()));
    const matchProject = !filterProject || tc.projectId === filterProject;
    const matchPriority = !filterPriority || tc.priority === filterPriority;
    return matchSearch && matchProject && matchPriority;
  });

  const handleCreate = async (data: Omit<TestCase, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    setSaving(true);
    try {
      const tc = await api.createTestCase(data);
      setTestCases((prev) => [tc, ...prev]);
      addNotification({ type: 'success', title: 'Test created!', message: tc.name });
      setShowCreate(false);
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to create test case.' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: Omit<TestCase, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTest) return;
    setSaving(true);
    try {
      const tc = await api.updateTestCase(editingTest.id, data);
      setTestCases((prev) => prev.map((t) => t.id === tc.id ? tc : t));
      addNotification({ type: 'success', title: 'Test updated!', message: tc.name });
      setEditingTest(null);
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to update test case.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteTestCase(id);
      setTestCases((prev) => prev.filter((tc) => tc.id !== id));
      addNotification({ type: 'success', title: 'Deleted', message: 'Test case removed.' });
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete test case.' });
    }
  };

  const handleRun = async (tc: TestCase) => {
    try {
      await api.triggerExecution({ projectId: tc.projectId, testCaseIds: [tc.id] });
      addNotification({ type: 'success', title: 'Running!', message: `Started ${tc.name}` });
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to start execution.' });
    }
  };

  return (
    <div>
      <Header
        title="Test Cases"
        subtitle={`${testCases.length} tests across ${projects.length} projects`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Sparkles className="w-4 h-4 mr-2 text-violet-400" />
              Generate with AI
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Test
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tests..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
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
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="h-10 rounded-md border border-white/10 bg-gray-800 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{filtered.length} tests</span>
          <span className="text-gray-600">·</span>
          <span className="text-emerald-400">{filtered.filter(t => t.lastResult === 'passed').length} passing</span>
          <span className="text-gray-600">·</span>
          <span className="text-red-400">{filtered.filter(t => t.lastResult === 'failed').length} failing</span>
          <span className="text-gray-600">·</span>
          <span className="text-violet-400">{filtered.filter(t => t.generatedByAI).length} AI-generated</span>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <FlaskConical className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">No tests found</h3>
            <p className="text-gray-500 mb-6">
              {search ? 'Try a different search query.' : 'Create your first test case.'}
            </p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Test
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((tc) => (
              <TestCaseRow
                key={tc.id}
                testCase={tc}
                onEdit={() => setEditingTest(tc)}
                onDelete={() => handleDelete(tc.id)}
                onRun={() => handleRun(tc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
          </DialogHeader>
          <TestCaseForm
            projects={projects}
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            isLoading={saving}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTest} onOpenChange={() => setEditingTest(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
          </DialogHeader>
          {editingTest && (
            <TestCaseForm
              initialData={editingTest}
              projects={projects}
              onSubmit={handleEdit}
              onCancel={() => setEditingTest(null)}
              isLoading={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
