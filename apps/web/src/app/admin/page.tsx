'use client';

import { useEffect, useState } from 'react';
import { Plus, UserPlus } from 'lucide-react';
import { Shell } from '../../components/Shell';
import { api } from '../../lib/api';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: 'TaskVader@123', role: 'STAFF', supervisorId: '' });
  const [assignment, setAssignment] = useState({ taskId: '', userId: '', type: 'PERMANENT' });

  function load() {
    setError('');
    api<any[]>('/users').then((rows) => {
      setUsers(rows);
      setForm((current) => ({ ...current, supervisorId: current.supervisorId || rows.find((u) => u.role !== 'STAFF')?.id || '' }));
      setAssignment((current) => ({ ...current, userId: current.userId || rows[0]?.id || '' }));
    }).catch((err) => setError(err.message));
    api<any[]>('/tasks?status=APPROVED').then((rows) => {
      setTasks(rows);
      setAssignment((current) => ({ ...current, taskId: current.taskId || rows[0]?.id || '' }));
    }).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function createUser(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/users', { method: 'POST', body: JSON.stringify(form) });
      setForm({ ...form, name: '', email: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create user');
    }
  }

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api('/assignments', { method: 'POST', body: JSON.stringify(assignment) });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to assign task');
    }
  }

  return (
    <Shell>
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-alert">{error}</div> : null}
      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createUser} className="rounded-lg border border-stone-200 bg-white p-4">
          <h1 className="mb-4 flex items-center gap-2 text-xl font-bold"><UserPlus className="h-5 w-5" />Create User</h1>
          <label className="mb-3 block text-sm font-medium">Name<input className="field mt-1 w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
          <label className="mb-3 block text-sm font-medium">Email<input className="field mt-1 w-full" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label className="mb-3 block text-sm font-medium">Password<input className="field mt-1 w-full" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          <label className="mb-3 block text-sm font-medium">Role<select className="field mt-1 w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="STAFF">Staff</option><option value="SUPERVISOR">Supervisor</option><option value="ADMIN">Admin</option></select></label>
          <label className="mb-4 block text-sm font-medium">Supervisor<select className="field mt-1 w-full" value={form.supervisorId} onChange={(e) => setForm({ ...form, supervisorId: e.target.value })}>{users.filter((u) => u.role !== 'STAFF').map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
          <button className="btn-primary"><Plus className="h-4 w-4" />Create user</button>
        </form>
        <form onSubmit={assign} className="rounded-lg border border-stone-200 bg-white p-4">
          <h2 className="mb-4 text-xl font-bold">Assign Approved Task</h2>
          <label className="mb-3 block text-sm font-medium">Task<select className="field mt-1 w-full" value={assignment.taskId} onChange={(e) => setAssignment({ ...assignment, taskId: e.target.value })}>{tasks.map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}</select></label>
          <label className="mb-3 block text-sm font-medium">Staff<select className="field mt-1 w-full" value={assignment.userId} onChange={(e) => setAssignment({ ...assignment, userId: e.target.value })}>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></label>
          <label className="mb-4 block text-sm font-medium">Assignment type<select className="field mt-1 w-full" value={assignment.type} onChange={(e) => setAssignment({ ...assignment, type: e.target.value })}><option value="PERMANENT">Permanent owner</option><option value="ACTING">Acting staff</option></select></label>
          <button className="btn-primary"><Plus className="h-4 w-4" />Assign task</button>
        </form>
      </div>
    </Shell>
  );
}
