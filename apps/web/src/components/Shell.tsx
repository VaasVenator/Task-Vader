'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, CalendarDays, CheckSquare, ClipboardList, LogOut, Shield, Users } from 'lucide-react';
import { getUser } from '../lib/api';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/worklogs', label: 'Daily Updates', icon: CheckSquare },
  { href: '/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/leaves', label: 'Leave', icon: CalendarDays },
  { href: '/admin', label: 'Admin', icon: Users },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();

  function logout() {
    localStorage.removeItem('task-vader-token');
    localStorage.removeItem('task-vader-user');
    router.push('/login');
  }

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-stone-200 bg-white md:block">
        <div className="flex h-16 items-center gap-3 border-b border-stone-200 px-5">
          <Shield className="h-7 w-7 text-signal" />
          <div>
            <div className="text-lg font-black tracking-normal">Task Vader</div>
            <div className="text-xs text-stone-500">LOLC Operations</div>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  active ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="md:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-stone-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div>
            <div className="text-sm text-stone-500">Signed in as</div>
            <div className="font-semibold">{user?.name ?? 'Guest'}</div>
          </div>
          <button className="btn-soft" onClick={logout} title="Log out">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </header>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
