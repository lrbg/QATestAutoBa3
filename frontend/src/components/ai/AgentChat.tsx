'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { api, USE_MOCK } from '@/lib/api';
import { AIMessage } from '@/lib/types';
import { cn, generateId } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const MOCK_RESPONSES = [
  "I've analyzed the provided URL and found **12 interactive elements** including forms, buttons, and navigation links.\n\nHere are the test cases I recommend:\n\n1. **Login form validation** - Test empty fields, invalid email, wrong password\n2. **Navigation menu** - Verify all links work and correct pages load\n3. **Search functionality** - Test with valid/invalid queries\n4. **Form submission** - Happy path and error states\n\nShall I generate the full Playwright code for these?",
  "Based on the error message you shared, the issue is a **timing problem** in the test. The selector `[data-testid=\"pay-btn\"]` appears after an async operation.\n\nHere's the fix:\n\n```javascript\n// Before (failing)\nawait page.click('[data-testid=\"pay-btn\"]');\n\n// After (fixed)\nawait page.waitForSelector('[data-testid=\"pay-btn\"]', { state: 'visible' });\nawait page.click('[data-testid=\"pay-btn\"]');\n```\n\nThis adds an explicit wait for the element to be visible before clicking.",
  "I've reviewed your test suite and found **3 improvement opportunities**:\n\n1. **Flaky test**: `tc-3` has inconsistent timeouts - increase to 45s\n2. **Missing assertions**: `tc-7` doesn't verify the status was saved\n3. **Test data**: Tests share state - add proper setup/teardown\n\nWould you like me to generate an improved version of these tests?",
];

interface AgentChatProps {
  projectId?: string;
  initialPrompts?: string[];
}

export function AgentChat({ projectId, initialPrompts }: AgentChatProps) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { aiMessages, addAIMessage, updateLastAIMessage, clearAIChat } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mockResponseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages]);

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText || isStreaming) return;

    setInput('');

    // Add user message
    const userMessage: AIMessage = {
      id: generateId(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMessage);

    // Add placeholder assistant message
    const assistantMessage: AIMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addAIMessage(assistantMessage);
    setIsStreaming(true);

    if (USE_MOCK) {
      // Simulate streaming
      const mockResponse = MOCK_RESPONSES[mockResponseIndex.current % MOCK_RESPONSES.length];
      mockResponseIndex.current++;
      let accumulated = '';
      for (let i = 0; i < mockResponse.length; i++) {
        accumulated += mockResponse[i];
        await new Promise((r) => setTimeout(r, 15));
        updateLastAIMessage(accumulated);
      }
      setIsStreaming(false);
      return;
    }

    try {
      const history = aiMessages.map((m) => ({ role: m.role, content: m.content }));
      const response = await api.chatWithAgent(messageText, projectId, history);

      if (!response.ok) throw new Error('Stream failed');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const text = parsed.delta?.text || parsed.choices?.[0]?.delta?.content || '';
                accumulated += text;
                updateLastAIMessage(accumulated);
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      }
    } catch (error) {
      updateLastAIMessage('Sorry, I encountered an error. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedPrompts = initialPrompts || [
    'Generate test cases for the login page',
    'Analyze my failing tests and suggest fixes',
    'Help me write Playwright code for checkout flow',
    'Review my test suite for coverage gaps',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-gray-100">AI Test Agent</h3>
              <p className="text-sm text-gray-400 max-w-sm">
                I can help you generate test cases, fix failing tests, analyze test coverage, and write Playwright automation code.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="text-left px-4 py-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-gray-300 hover:text-gray-100 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {aiMessages.map((message) => (
              <div
                key={message.id}
                className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center',
                    message.role === 'user'
                      ? 'bg-violet-500/30 border border-violet-500/50'
                      : 'bg-indigo-500/30 border border-indigo-500/50'
                  )}
                >
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-violet-300" />
                  ) : (
                    <Bot className="w-4 h-4 text-indigo-300" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-xl px-4 py-3',
                    message.role === 'user'
                      ? 'bg-violet-500/20 border border-violet-500/30 text-gray-100'
                      : 'bg-white/5 border border-white/10 text-gray-200'
                  )}
                >
                  {message.isStreaming && !message.content ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">Thinking...</span>
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}
                  {message.isStreaming && message.content && (
                    <span className="inline-block w-0.5 h-4 bg-violet-400 animate-pulse ml-0.5" />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-white/10 p-4">
        {aiMessages.length > 0 && (
          <div className="flex justify-end mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAIChat}
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Clear Chat
            </Button>
          </div>
        )}
        <div className="flex gap-3 items-end bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-violet-500/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to generate tests, fix failures, or analyze coverage..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none resize-none max-h-32 min-h-[24px]"
            style={{ height: 'auto' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'h-8 w-8 rounded-lg flex-shrink-0',
              input.trim() && !isStreaming ? 'bg-violet-500 hover:bg-violet-600' : 'bg-gray-700'
            )}
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
