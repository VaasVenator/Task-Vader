'use client';

import { useEffect, useState } from 'react';
import { Award, CalendarDays, Clock, ClipboardCheck } from 'lucide-react';
import { Shell } from '../../components/Shell';
import { api, getUser } from '../../lib/api';

type Leader = { userId: string; name: string; score: number; medal: string };

export default function DashboardPage() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [supervisor, setSupervisor] = useState<any>(null);
  const user = getUser();

  useEffect(() => {
    api<Leader[]>('/dashboard/leaderboard').then(setLeaders).catch(() => setLeaders([]));
    if (user?.role !== 'STAFF') {
      api('/dashboard/supervisor').then(setSupervisor).catch(() => setSupervisor(null));
    }
  }, []);

  return (
    <Shell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Operations Dashboard</h1>
        <p className="text-sm text-stone-500">Weekly recognition, workload, productivity, approvals, and leave visibility.</p>
      </div>
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Top 3 Performers Last Week</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {leaders.map((leader) => (
            <div key={leader.userId} className="rounded-lg border border-stone-200 bg-white p-4">
              <Award className={`mb-3 h-6 w-6 ${leader.medal === 'gold' ? 'text-yellow-500' : leader.medal === 'silver' ? 'text-stone-400' : 'text-amber-700'}`} />
              <div className="font-semibold">{leader.name}</div>
              <div className="text-sm capitalize text-stone-500">{leader.medal} medal</div>
              <div className="mt-2 text-sm">Score: {Math.round(leader.score).toLocaleString()}</div>
            </div>
          ))}
          {leaders.length === 0 ? <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-500">No scored activity for last week yet.</div> : null}
        </div>
      </section>
      {supervisor ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <Metric icon={ClipboardCheck} label="Pending task approvals" value={supervisor.pendingApprovals.tasks} />
          <Metric icon={CalendarDays} label="Pending leave approvals" value={supervisor.pendingApprovals.leave} />
          <Metric icon={Clock} label="Staff workload rows" value={supervisor.workload.length} />
          <Metric icon={ClipboardCheck} label="Task productivity rows" value={supervisor.productivity.length} />
        </div>
      ) : null}
    </Shell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <Icon className="mb-3 h-5 w-5 text-signal" />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-stone-500">{label}</div>
    </div>
  );
}
