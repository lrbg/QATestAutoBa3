'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { api } from '@/lib/api';


export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, addNotification } = useStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    tenantName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.register(form);
      setAuth(response.user, response.access_token);
      addNotification({ type: 'success', title: 'Account created!', message: 'Welcome to QA Platform' });
      router.replace("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <p className="text-white font-bold text-lg">QA Platform</p>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={form.name}
            onChange={handleChange('name')}
            placeholder="John Doe"
            leftIcon={<User className="w-4 h-4" />}
            required
          />
          <Input
            label="Company / Team Name"
            value={form.tenantName}
            onChange={handleChange('tenantName')}
            placeholder="Acme Corp"
            leftIcon={<Building2 className="w-4 h-4" />}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange('email')}
            placeholder="you@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            placeholder="Min. 8 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            helperText="Must be at least 8 characters"
            required
          />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Create Account
          </Button>
        </form>

        <p className="text-xs text-gray-600 text-center">
          By registering you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
