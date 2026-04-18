'use client';

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TestCase, TestStep, Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { generateId } from '@/lib/utils';

interface TestCaseFormProps {
  initialData?: Partial<TestCase>;
  projects: Project[];
  onSubmit: (data: Omit<TestCase, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'] as const;
const STATUS_OPTIONS = ['draft', 'active', 'archived'] as const;

export function TestCaseForm({
  initialData,
  projects,
  onSubmit,
  onCancel,
  isLoading,
}: TestCaseFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [projectId, setProjectId] = useState(initialData?.projectId || projects[0]?.id || '');
  const [priority, setPriority] = useState<TestCase['priority']>(initialData?.priority || 'medium');
  const [status, setStatus] = useState<TestCase['status']>(initialData?.status || 'draft');
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '');
  const [playwrightCode, setPlaywrightCode] = useState(initialData?.playwrightCode || '');
  const [steps, setSteps] = useState<TestStep[]>(
    initialData?.steps || [
      { id: generateId(), order: 1, action: 'navigate', value: '', expectedResult: '' },
    ]
  );

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: generateId(), order: prev.length + 1, action: 'click', value: '', expectedResult: '' },
    ]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) =>
      prev
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
  };

  const updateStep = (id: string, field: keyof TestStep, value: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      projectId,
      name,
      description,
      steps,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      priority,
      status,
      generatedByAI: initialData?.generatedByAI || false,
      playwrightCode: playwrightCode || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Test Case Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., User can login with valid credentials"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this test verifies..."
            rows={3}
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full h-10 rounded-md border border-white/10 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'flex-1 py-2 text-xs font-medium rounded-md border transition-all capitalize',
                  priority === p
                    ? p === 'critical'
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : p === 'high'
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : p === 'medium'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                      : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TestCase['status'])}
            className="w-full h-10 rounded-md border border-white/10 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Tags (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="smoke, auth, e2e"
          />
        </div>
      </div>

      {/* Test Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">Test Steps</label>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Step
          </Button>
        </div>
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
                <span className="text-xs text-gray-500 w-4 text-center">{index + 1}</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-2 min-w-0">
                <select
                  value={step.action}
                  onChange={(e) => updateStep(step.id, 'action', e.target.value)}
                  className="h-8 rounded border border-white/10 bg-gray-800 px-2 text-xs text-gray-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {['navigate', 'click', 'fill', 'press', 'assert', 'wait', 'request', 'screenshot'].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <input
                  value={step.selector || step.value || ''}
                  onChange={(e) => updateStep(step.id, step.action === 'fill' || step.action === 'click' ? 'selector' : 'value', e.target.value)}
                  placeholder={step.action === 'navigate' ? '/path or URL' : step.action === 'click' || step.action === 'fill' ? '[selector]' : 'value'}
                  className="h-8 rounded border border-white/10 bg-white/5 px-2 text-xs text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <input
                  value={step.expectedResult || ''}
                  onChange={(e) => updateStep(step.id, 'expectedResult', e.target.value)}
                  placeholder="Expected result..."
                  className="h-8 rounded border border-white/10 bg-white/5 px-2 text-xs text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
              <button
                type="button"
                onClick={() => removeStep(step.id)}
                className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors mt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Playwright Code */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">
          Playwright Code{' '}
          <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={playwrightCode}
          onChange={(e) => setPlaywrightCode(e.target.value)}
          placeholder={`test('Test name', async ({ page }) => {\n  await page.goto('/');\n  // ...\n});`}
          rows={6}
          className="w-full rounded-md border border-white/10 bg-gray-950 px-3 py-2 text-sm text-gray-300 placeholder:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 resize-none font-mono"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Test Case'}
        </Button>
      </div>
    </form>
  );
}
