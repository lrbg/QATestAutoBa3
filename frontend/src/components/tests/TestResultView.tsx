'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Clock, SkipForward, Terminal } from 'lucide-react';
import { TestResult } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn, formatDuration, getStatusBg } from '@/lib/utils';

interface TestResultViewProps {
  results: TestResult[];
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'passed':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'failed':
    case 'error':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'skipped':
      return <SkipForward className="w-4 h-4 text-gray-400" />;
    default:
      return <Clock className="w-4 h-4 text-amber-400 animate-pulse-soft" />;
  }
}

function ResultRow({ result }: { result: TestResult }) {
  const [expanded, setExpanded] = useState(result.status === 'failed');

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon status={result.status} />
        <span className="flex-1 text-sm font-medium text-gray-200">{result.testCaseName}</span>
        {result.duration && (
          <span className="text-xs text-gray-500">{formatDuration(result.duration)}</span>
        )}
        <Badge className={cn('text-xs', getStatusBg(result.status))}>
          {result.status}
        </Badge>
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/10 bg-gray-950/50 p-4 space-y-3">
          {result.errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-xs font-medium text-red-400 mb-1">Error</p>
              <p className="text-xs text-red-300 font-mono">{result.errorMessage}</p>
            </div>
          )}

          {result.logs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-medium text-gray-400">Execution Logs</p>
              </div>
              <div className="bg-gray-950 border border-white/10 rounded-md p-3 space-y-1">
                {result.logs.map((log, i) => (
                  <p key={i} className="text-xs font-mono text-gray-300">
                    <span className="text-gray-600 mr-2">{String(i + 1).padStart(2, '0')}</span>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}

          {result.screenshot && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Screenshot</p>
              <img
                src={result.screenshot}
                alt="Test screenshot"
                className="rounded-md border border-white/10 max-h-48 object-cover"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TestResultView({ results }: TestResultViewProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Clock className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No results available yet</p>
      </div>
    );
  }

  const passed = results.filter((r) => r.status === 'passed').length;
  const failed = results.filter((r) => r.status === 'failed' || r.status === 'error').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">{passed} passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="w-4 h-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">{failed} failed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <SkipForward className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-400">{skipped} skipped</span>
        </div>
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden ml-auto">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(passed / results.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Results list */}
      <div className="space-y-2">
        {results.map((result) => (
          <ResultRow key={result.id} result={result} />
        ))}
      </div>
    </div>
  );
}
