'use client';

import React, { useState } from 'react';
import { Bot, Sparkles, Zap, FlaskConical, Wrench, BarChart3 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { AgentChat } from '@/components/ai/AgentChat';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

const CAPABILITIES = [
  {
    icon: FlaskConical,
    title: 'Generate Tests',
    description: 'AI analyzes your pages and creates comprehensive test cases',
    color: 'violet',
    prompt: 'Generate test cases for https://example.com/login - login, validation, and error handling',
  },
  {
    icon: Wrench,
    title: 'Fix Failures',
    description: 'Paste a failing test and get instant fixes with explanations',
    color: 'amber',
    prompt: 'This test is failing: TimeoutError waiting for [data-testid="submit-btn"]. How do I fix it?',
  },
  {
    icon: BarChart3,
    title: 'Analyze Coverage',
    description: 'Review your test suite and identify gaps in coverage',
    color: 'blue',
    prompt: 'Analyze my test suite coverage and suggest what tests I\'m missing',
  },
  {
    icon: Zap,
    title: 'Optimize Tests',
    description: 'Get suggestions to make tests faster and more reliable',
    color: 'emerald',
    prompt: 'How can I make my Playwright tests run faster and reduce flakiness?',
  },
];

const colorMap = {
  violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function AIAgentPage() {
  const { aiMessages } = useStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  const suggestedPrompts = CAPABILITIES.map((c) => c.prompt);

  return (
    <div className="h-screen flex flex-col">
      <Header
        title="AI Agent"
        subtitle="Powered by Claude — generate, fix, and analyze tests"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 border-r border-white/10 bg-gray-950/50 p-4 space-y-4 overflow-y-auto hidden lg:block">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Capabilities
            </p>
            <div className="space-y-2">
              {CAPABILITIES.map((cap) => {
                const Icon = cap.icon;
                return (
                  <div
                    key={cap.title}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border',
                      colorMap[cap.color as keyof typeof colorMap]
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium">{cap.title}</p>
                      <p className="text-xs opacity-70 mt-0.5">{cap.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              About
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <p>Powered by <span className="text-violet-400">Claude claude-sonnet-4-6</span></p>
              <p>Uses MCP tools to analyze DOM structure and generate accurate tests.</p>
              <div className="bg-white/5 rounded-lg p-3 mt-3">
                <p className="text-gray-400 font-medium mb-1">MCP Tools Available</p>
                <ul className="space-y-1 text-gray-500">
                  <li>• extract_dom_attributes</li>
                  <li>• detect_user_flows</li>
                  <li>• generate_test_steps</li>
                  <li>• navigate_and_snapshot</li>
                  <li>• find_testable_elements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <AgentChat
            projectId={selectedProjectId}
            initialPrompts={suggestedPrompts.slice(0, 4)}
          />
        </div>
      </div>
    </div>
  );
}
