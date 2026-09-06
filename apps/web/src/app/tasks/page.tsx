'use client';

import { useEffect, useState } from 'react';
import { Check, Eye, Plus, X } from 'lucide-react';
import { Shell } from '../../components/Shell';
import { api, getUser } from '../../lib/api';

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [detail, setDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', duration: 1, durationUnit: 'MINUTES', complexity: 3, approvalSupervisorId: '' });
  const user = getUser();

  function load() {
    setError('');
    api<any[]>('/tasks').then(setTasks).catch((err) => setError(err.message));
    api<any[]>('/users/supervisors').then((rows) => {
      setSupervisors(rows);
      setForm((current) => ({ ...current, approvalSupervisorId: current.approvalSupervisorId || rows[0]?.id || '' }));
    }).catch((err) => setError(err.message));
    if (user?.role !== 'STAFF') api<any[]>('/tasks/pending').then(setPending).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/tasks', { method: 'POST', body: JSON.stringify(form) });
      setForm({ ...form, name: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create task');
    }
  }

  async function review(id: string, approve: boolean) {
    const reason = approve ? undefined : prompt('Reason for rejection') || '';
    try {
      await api(`/tasks/${id}/${approve ? 'approve' : 'reject'}`, { method: 'PATCH', body: JSON.stringify({ reason }) });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to review task');
    }
  }

  return (
    <Shell>
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-alert">{error}</div> : null}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={create} className="rounded-lg border border-stone-200 bg-white p-4">
          <h1 className="mb-4 text-xl font-bold">Create Task</h1>
          <label className="mb-3 block text-sm font-medium">Task name<input className="field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <label className="block text-sm font-medium">Duration<input className="field mt-1 w-full" type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} /></label>
            <label className="block text-sm font-medium">Unit<select className="field mt-1 w-full" value={form.durationUnit} onChange={(e) => setForm({ ...form, durationUnit: e.target.value })}><option value="MINUTES">Minutes</option><option value="SECONDS">Seconds</option></select></label>
          </div>
          <label className="mb-3 block text-sm font-medium">Complexity<select className="field mt-1 w-full" value={form.complexity} onChange={(e) => setForm({ ...form, complexity: Number(e.target.value) })}><option value={1}>Very low</option><option value={2}>Low</option><option value={3}>Medium</option><option value={4}>High</option><option value={5}>Very high</option></select></label>
          <label className="mb-4 block text-sm font-medium">Approval supervisor<select className="field mt-1 w-full" value={form.approvalSupervisorId} onChange={(e) => setForm({ ...form, approvalSupervisorId: e.target.value })}>{supervisors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <button className="btn-primary w-full"><Plus className="h-4 w-4" />Submit task</button>
        </form>
        <div>
          {pending.length ? <ApprovalPanel pending={pending} review={review} /> : null}
          <h2 className="mb-3 text-xl font-bold">Available Tasks</h2>
          <div className="grid gap-3">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-lg border border-stone-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{task.name}</div>
                    <div className="text-sm text-stone-500">{Math.round(task.timePerUnitSeconds / 60 * 100) / 100} min per unit · complexity {task.complexity} · {task.status.toLowerCase()}</div>
                  </div>
                  <button className="btn-soft" onClick={async () => {
                    try {
                      setDetail(await api(`/tasks/${task.id}`));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to load task details');
                    }
                  }}><Eye className="h-4 w-4" />Details</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {detail ? <TaskDetail detail={detail} close={() => setDetail(null)} /> : null}
    </Shell>
  );
}

function ApprovalPanel({ pending, review }: { pending: any[]; review: (id: string, approve: boolean) => void }) {
  return (
    <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="mb-3 font-semibold">Pending Task Approvals</h2>
      {pending.map((task) => (
        <div key={task.id} className="mb-2 flex items-center justify-between gap-3 rounded-md bg-white p-3">
          <span>{task.name}</span>
          <div className="flex gap-2"><button className="btn-soft" onClick={() => review(task.id, true)}><Check className="h-4 w-4" />Approve</button><button className="btn-soft" onClick={() => review(task.id, false)}><X className="h-4 w-4" />Reject</button></div>
        </div>
      ))}
    </section>
  );
}

function TaskDetail({ detail, close }: { detail: any; close: () => void }) {
  const permanent = detail.assignments.filter((a: any) => a.type === 'PERMANENT').map((a: any) => a.user.name).join(', ') || 'Unassigned';
  const acting = detail.assignments.filter((a: any) => a.type === 'ACTING').map((a: any) => a.user.name).join(', ') || 'None';
  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">{detail.name}</h2><button className="btn-soft" onClick={close}>Close</button></div>
        <dl className="grid gap-2 text-sm">
          <Row label="Permanent owner" value={permanent} />
          <Row label="Acting owners" value={acting} />
          <Row label="Created by" value={detail.createdBy.name} />
          <Row label="Approved by" value={detail.approvalSupervisor.name} />
          <Row label="Complexity" value={String(detail.complexity)} />
          <Row label="Average units per active day" value={detail.averageUnitsPerActiveDayLast30.toFixed(2)} />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-2 gap-3 border-b border-stone-100 py-2"><dt className="text-stone-500">{label}</dt><dd className="font-medium">{value}</dd></div>;
}
