import React, { useMemo, useState } from 'react';
import { Activity, Filter } from 'lucide-react';
import { useWork } from '../../lib/work';
import { Avatar, Badge, PageHeader } from '../../components/ui';
import { ADMIN_LOGS } from '../../lib/mock';
import { relTime, cn } from '../../lib/utils';

export default function AdminActivity() {
  const { user, work, mode } = useWork();
  const live = mode === 'api';
  const source = live ? work.globalAnalytics?.logs || ADMIN_LOGS : ADMIN_LOGS;
  const ACTIONS = useMemo(() => [...new Set(source.map((l) => l.action))], [source]);
  const [q, setQ] = useState('');
  const [action, setAction] = useState('all');
  const [range, setRange] = useState('all');

  const logs = useMemo(
    () =>
      source.filter((l) => {
        const u = user(l.userId);
        const text = (l.action + ' ' + l.target + ' ' + (u?.name || '')).toLowerCase();
        if (q && !text.includes(q.toLowerCase())) return false;
        if (action !== 'all' && l.action !== action) return false;
        const age = (Date.now() - +new Date(l.time)) / 86400000;
        if (range === '7' && age > 7) return false;
        if (range === '30' && age > 30) return false;
        return true;
      }),
    [q, action, range, user, source]
  );

  return (
    <div className="mx-auto max-w-[1050px]">
      <PageHeader title="Activity Logs" sub="Registrations, role changes, uploads, reviews and system actions" />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Filter size={13} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input className="input w-56 pl-9 text-[12.5px]" placeholder="Filter by user, action, project…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto py-2 text-[12.5px]" value={action} onChange={(e) => setAction(e.target.value)} aria-label="Filter by action">
          <option value="all">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <div className="flex gap-1.5">
          {[['all', 'All time'], ['7', '7 days'], ['30', '30 days']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setRange(v)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                range === v ? 'border-wine/40 bg-wine-soft text-wine' : 'border-line bg-card text-ink-2 hover:border-line-2'
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[12px] text-faint">{logs.length} events</span>
      </div>

      <div className="card overflow-hidden">
        {logs.map((l) => {
          const u = user(l.userId);
          return (
            <div key={l.id} className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5 transition-colors last:border-0 hover:bg-ink/2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wine-soft text-wine">
                <Activity size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{u?.name || 'System'}</span>
                  <Badge tone={l.action.includes('registered') ? 'moss' : l.action.includes('role') ? 'copper' : l.action.includes('suspended') ? 'rust' : 'neutral'}>
                    {l.action.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-ink-2">{l.target}</div>
              </div>
              <span className="text-[11.5px] text-faint">{relTime(l.time)}</span>
            </div>
          );
        })}
        {logs.length === 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-faint">No events match the current filters.</div>
        )}
      </div>
    </div>
  );
}
