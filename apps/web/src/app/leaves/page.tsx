'use client';

import { useEffect, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Shell } from '../../components/Shell';
import { api, getUser } from '../../lib/api';

export default function LeavesPage() {
  const user = getUser();
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ leaveDate: new Date().toISOString().slice(0, 10), type: 'SICK', reason: '', supervisorId: '' });

  function load() {
    setError('');
    api<any[]>('/users/supervisors').then((rows) => {
      setSupervisors(rows);
      setForm((current) => ({ ...current, supervisorId: current.supervisorId || rows[0]?.id || '' }));
    }).catch((err) => setError(err.message));
    api<any[]>('/leave/mine').then(setMine).catch((err) => setError(err.message));
    if (user?.role !== 'STAFF') api<any[]>('/leave/pending').then(setPending).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/leave', { method: 'POST', body: JSON.stringify(form) });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit leave');
    }
  }

  async function review(id: string, approve: boolean) {
    const reason = approve ? undefined : prompt('Reason for rejection') || '';
    try {
      await api(`/leave/${id}/${approve ? 'approve' : 'reject'}`, { method: 'PATCH', body: JSON.stringify({ reason }) });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review leave');
    }
  }

  return (
    <Shell>
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-alert">{error}</div> : null}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submit} className="rounded-lg border border-stone-200 bg-white p-4">
          <h1 className="mb-4 text-xl font-bold">Request Leave Override</h1>
          <label className="mb-3 block text-sm font-medium">Date<input className="field mt-1 w-full" type="date" value={form.leaveDate} onChange={(e) => setForm({ ...form, leaveDate: e.target.value })} /></label>
          <label className="mb-3 block text-sm font-medium">Reason type<select className="field mt-1 w-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="SICK">Sick</option><option value="CASUAL">Casual</option><option value="ANNUAL">Annual</option></select></label>
          <label className="mb-3 block text-sm font-medium">Note<textarea className="field mt-1 w-full" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></label>
          <label className="mb-4 block text-sm font-medium">Supervisor<select className="field mt-1 w-full" value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}>{supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <button className="btn-primary w-full"><Plus className="h-4 w-4" />Submit leave</button>
        </form>
        <div className="space-y-6">
          {pending.length ? (
            <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h2 className="mb-3 font-semibold">Pending Leave Approvals</h2>
              {pending.map((leave) => (
                <div key={leave.id} className="mb-2 flex items-center justify-between rounded-md bg-white p-3">
                  <span>{leave.user.name} · {leave.leaveDate.slice(0, 10)} · {leave.type.toLowerCase()}</span>
                  <div className="flex gap-2"><button className="btn-soft" onClick={() => review(leave.id, true)}><Check className="h-4 w-4" />Approve</button><button className="btn-soft" onClick={() => review(leave.id, false)}><X className="h-4 w-4" />Reject</button></div>
                </div>
              ))}
            </section>
          ) : null}
          <section>
            <h2 className="mb-3 text-xl font-bold">My Leave Overrides</h2>
            <div className="grid gap-3">
              {mine.map((leave) => <div key={leave.id} className="rounded-lg border border-stone-200 bg-white p-4 text-sm">{leave.leaveDate.slice(0, 10)} · {leave.type.toLowerCase()} · {leave.status.toLowerCase()}</div>)}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
