'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, addNotification } = useStore();
  const [email, setEmail] = useState('demo@qaplatform.io');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login({ email, password });
      setAuth(response.user, response.access_token);
      addNotification({ type: 'success', title: 'Welcome back!', message: `Logged in as ${response.user.name}` });
      router.replace(`${basePath}/dashboard`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-900/40 via-gray-900 to-indigo-900/40 flex-col justify-between p-12 border-r border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-bold">QA Platform</p>
            <p className="text-gray-400 text-xs">Test Management Suite</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold text-white leading-tight">
              AI-Powered<br />
              <span className="gradient-text">Test Automation</span>
            </h2>
            <p className="text-gray-400 text-lg">
              Generate, manage and execute tests with Claude AI. Connect your GitHub repos and ship with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Test Cases', value: '10K+' },
              { label: 'Pass Rate', value: '98.2%' },
              { label: 'Teams', value: '500+' },
              { label: 'Executions', value: '1M+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-600 text-sm">
          © 2024 QA Platform. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <p className="text-white font-bold text-lg">QA Platform</p>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Sign in to your account</h1>
            <p className="text-gray-400 mt-2 text-sm">
              Don&apos;t have an account?{' '}
              <Link href={`${basePath}/register`} className="text-violet-400 hover:text-violet-300">
                Create one for free
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Sign in
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-500">
              <span className="bg-gray-950 px-2">Demo credentials pre-filled</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
            <p className="text-xs text-gray-400">
              <span className="text-gray-500">Email:</span> demo@qaplatform.io
            </p>
            <p className="text-xs text-gray-400">
              <span className="text-gray-500">Password:</span> demo123
            </p>
            <p className="text-xs text-gray-600 mt-2">
              This demo uses mock data — no backend required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
