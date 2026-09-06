'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Eye, EyeOff, Save, TriangleAlert } from 'lucide-react';
import { Shell } from '../../components/Shell';
import { api } from '../../lib/api';

export default function WorkLogsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showActing, setShowActing] = useState(false);
  const [permanent, setPermanent] = useState<any[]>([]);
  const [acting, setActing] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [warning, setWarning] = useState<any>(null);
  const [error, setError] = useState('');
  const tasks = showActing ? [...permanent, ...acting] : permanent;

  function load() {
    setError('');
    api<any[]>('/work-logs/assigned').then(setPermanent).catch((err) => setError(err.message));
    api<any[]>('/work-logs/assigned?acting=true').then(setActing).catch((err) => setError(err.message));
    api('/work-logs/warning').then(setWarning).catch((err) => setError(err.message));
  }

  useEffect(load, []);

  async function save(assignment: any) {
    try {
      await api('/work-logs', {
        method: 'POST',
        body: JSON.stringify({
          taskId: assignment.task.id,
          workDate: date,
          completedUnits: Number(counts[assignment.task.id] ?? 0),
        }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save daily update');
    }
  }

  return (
    <Shell>
      {error ? <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-alert">{error}</div> : null}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Daily Updates</h1>
          <p className="text-sm text-stone-500">Record your own contribution per assigned task. Future dates are blocked by the API.</p>
        </div>
        <label className="text-sm font-medium">Work date<input className="field ml-2" type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      {warning?.warning ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-alert">
          <TriangleAlert className="h-4 w-4" /> No working-day updates for {warning.missedWorkingDaysInARow} straight days.
        </div>
      ) : null}
      <button className="btn-soft mb-4" onClick={() => setShowActing(!showActing)}>
        {showActing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {showActing ? 'Hide acting tasks' : 'Show acting tasks'}
      </button>
      <div className="grid gap-3">
        {tasks.map((assignment) => (
          <div key={assignment.id} className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 md:grid-cols-[1fr_160px_110px] md:items-center">
            <div>
              <div className="flex items-center gap-2 font-semibold"><CalendarCheck className="h-4 w-4 text-signal" />{assignment.task.name}</div>
              <div className="text-sm text-stone-500">{assignment.type.toLowerCase()} · {Math.round((assignment.task.timePerUnitSeconds / 60) * 100) / 100} min/unit</div>
            </div>
            <input className="field w-full" type="number" min={0} placeholder="Units" value={counts[assignment.task.id] ?? ''} onChange={(e) => setCounts({ ...counts, [assignment.task.id]: Number(e.target.value) })} />
            <button className="btn-primary" onClick={() => save(assignment)}><Save className="h-4 w-4" />Save</button>
          </div>
        ))}
        {tasks.length === 0 ? <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">No assigned tasks yet.</div> : null}
      </div>
    </Shell>
  );
}
