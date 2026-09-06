'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { API_URL } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('supervisor@lolc.com');
  const [password, setPassword] = useState('TaskVader@123');
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    let response: Response;
    try {
      response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      setError(`Cannot connect to the Task Vader API at ${API_URL}. Start the API server and try again.`);
      return;
    }
    if (!response.ok) {
      setError('Invalid email or password');
      return;
    }
    const data = await response.json();
    localStorage.setItem('task-vader-token', data.token);
    localStorage.setItem('task-vader-user', JSON.stringify(data.user));
    router.push('/dashboard');
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(120deg,#f7f7f4_0%,#eef5f1_55%,#f7f7f4_100%)] p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-8 w-8 text-signal" />
          <div>
            <h1 className="text-2xl font-black tracking-normal">Task Vader</h1>
            <p className="text-sm text-stone-500">LOLC Holdings PLC Operations</p>
          </div>
        </div>
        <label className="mb-3 block">
          <span className="text-sm font-medium">Email</span>
          <input className="field mt-1 w-full" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mb-4 block">
          <span className="text-sm font-medium">Password</span>
          <input className="field mt-1 w-full" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <div className="mb-3 rounded-md bg-red-50 p-2 text-sm text-alert">{error}</div> : null}
        <button className="btn-primary w-full" type="submit">
          Sign in
        </button>
        <p className="mt-4 text-xs text-stone-500">Seed login: supervisor@lolc.com / TaskVader@123</p>
      </form>
    </main>
  );
}
