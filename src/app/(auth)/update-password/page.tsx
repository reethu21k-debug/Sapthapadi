// app/auth/update-password/page.tsx
'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState('');
  const [error, setError]       = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  async function handleSubmit() {
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8)  { setError('Minimum 8 characters');   return; }

    setLoading(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) setError(error.message);
    else { setMessage('Password updated! Redirecting...'); setTimeout(() => window.location.href = '/dashboard', 2000); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card shadow-soft">
        <h1 className="text-2xl font-bold text-foreground mb-2">Set new password</h1>
        <p className="text-muted-foreground text-sm mb-6">Must be at least 8 characters.</p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {error   && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm text-success">{message}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </div>
      </div>
    </div>
  );
}