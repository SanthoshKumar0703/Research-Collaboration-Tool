import React from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { useWork } from '../lib/work';
import { Reveal, Ring, Stat } from '../components/ui';
import { usePalette, R } from '../lib/palette';
import {
  WEEKLY_ACTIVITY, TASK_TREND, MONTHLY_DOCS, CONTRIBUTIONS, HEATMAP,
} from '../lib/mock';
import { fmtDate, daysUntil } from '../lib/utils';

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-lift">
      {label && <div className="mb-1 text-faint">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-faint">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ProjectAnalytics({ scope = 'project' }) {
  const { id } = useParams();
  const { work, project, mode } = useWork();
  const p = usePalette();
  const proj = scope === 'project' ? project(id) : null;
  const pid = scope === 'project' ? id : 'p1';
  const A = mode === 'api' ? (work.analytics?.[pid] || null) : null;

  const tasks = work.tasks.filter((t) => t.projectId === pid);
  const exps = work.experiments.filter((e) => e.projectId === pid);
  const docs = work.documents.filter((d) => d.projectId === pid);
  const milestones = work.milestones.filter((m) => m.projectId === pid);
  const done = tasks.filter((t) => t.status === 'completed').length;

  const expData = [
    { name: 'Completed', value: exps.filter((e) => e.status === 'Completed').length, fill: R(p.moss) },
    { name: 'Running', value: exps.filter((e) => e.status === 'Running').length, fill: R(p.copper) },
    { name: 'Under review', value: exps.filter((e) => e.status === 'Under Review').length, fill: R(p.gold) },
    { name: 'Planned', value: exps.filter((e) => e.status === 'Planned').length, fill: R(p.line2) },
    { name: 'Failed', value: exps.filter((e) => e.status === 'Failed').length, fill: R(p.rust) },
  ];

  const deadlines = [
    ...milestones.filter((m) => m.status !== 'Completed').map((m) => ({ label: m.name, due: m.due, kind: 'Milestone' })),
    ...tasks.filter((t) => t.status !== 'completed').map((t) => ({ label: t.title, due: t.due, kind: 'Task' })),
  ]
    .filter((x) => new Date(x.due) >= new Date())
    .sort((a, b) => +new Date(a.due) - +new Date(b.due))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Overall progress" value={proj ? proj.progress : 55} suffix="%" delta="vs last month +6%" />
        <Stat label="Task completion" value={tasks.length ? Math.round((done / tasks.length) * 100) : 0} suffix="%" sub={`${done}/${tasks.length} tasks`} />
        <Stat label="Experiments" value={exps.length} sub={`${exps.filter((e) => e.status === 'Completed').length} successful`} />
        <Stat label="Documents" value={docs.length} sub={`${docs.filter((d) => d.review === 'Approved').length} approved`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Reveal>
          <div className="card h-full p-5">
            <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Research activity · 12 weeks</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={(A?.weekly && A.weekly.length ? A.weekly : WEEKLY_ACTIVITY)} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="anaAct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={R(p.wine)} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={R(p.wine)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={R(p.line, 0.55)} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} cursor={{ stroke: R(p.line2) }} />
                  <Area type="monotone" dataKey="events" name="Events" stroke={R(p.wine)} strokeWidth={2.2} fill="url(#anaAct)" />
                  <Area type="monotone" dataKey="experiments" name="Experiments" stroke={R(p.gold)} strokeWidth={1.8} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="card h-full p-5">
            <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Task completion trend</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(A?.trend && A.trend.length ? A.trend : TASK_TREND)} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke={R(p.line, 0.55)} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} cursor={{ fill: R(p.line, 0.25) }} />
                  <Bar dataKey="completed" name="Completed" fill={R(p.moss)} radius={[4, 4, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="open" name="Open" fill={R(p.line2)} radius={[4, 4, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="card h-full p-5">
            <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Experiment statistics</h3>
            <div className="flex items-center gap-4">
              <div className="h-[190px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expData} innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0} dataKey="value" startAngle={90} endAngle={-270}>
                      {expData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                    </Pie>
                    <Tooltip content={<Tip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {expData.filter((d) => d.value > 0).map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[12px]">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.fill }} />
                    <span className="text-ink-2">{d.name}</span>
                    <span className="font-mono font-semibold text-ink">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
              {[
                [`${Math.round((expData[0].value / Math.max(1, exps.length)) * 100)}%`, 'success rate'],
                [`${exps.filter((e) => e.status === 'Failed').length}`, 'failed runs'],
                [`${exps.filter((e) => e.status === 'Under Review').length}`, 'in review'],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-lg font-semibold text-ink">{v}</div>
                  <div className="text-[10px] tracking-wide text-faint uppercase">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.09}>
          <div className="card h-full p-5">
            <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Milestone progress</h3>
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id}>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="font-medium text-ink-2">{m.name}</span>
                    <span className="text-faint">{m.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                    <motion.div
                      className={`h-full rounded-full ${m.status === 'Completed' ? 'bg-moss' : m.status === 'In Progress' ? 'bg-wine' : 'bg-line-2'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.progress}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="card h-full p-5">
            <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Team contribution</h3>
            <div className="space-y-4">
              {(A?.contributions && A.contributions.length ? A.contributions : CONTRIBUTIONS).map((c, i) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="font-medium text-ink-2">{c.name}</span>
                    <span className="text-faint">{c.hours}{A?.contributionLabel === 'events' ? ' events' : 'h'} this quarter</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                    <motion.div
                      className={`h-full rounded-full ${i === 0 ? 'bg-wine' : i === 1 ? 'bg-copper' : 'bg-gold'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(c.hours / 62) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <h4 className="mb-3 text-[11px] font-semibold tracking-wider text-faint uppercase">Document activity · 6 months</h4>
              <div className="h-[110px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(A?.monthly && A.monthly.length ? A.monthly : MONTHLY_DOCS)} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fill: R(p.faint), fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: R(p.faint), fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ fill: R(p.line, 0.25) }} />
                    <Bar dataKey="docs" name="Documents" fill={R(p.copper)} radius={[4, 4, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.09}>
          <div className="card h-full p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[15.5px] font-semibold text-ink">Activity heatmap</h3>
              <div className="flex items-center gap-1.5 text-[10.5px] text-faint">
                Less
                {[0.1, 0.25, 0.45, 0.7, 1].map((a) => (
                  <span key={a} className="h-2.5 w-2.5 rounded-sm" style={{ background: R(p.wine, a) }} />
                ))}
                More
              </div>
            </div>
            <div className="grid grid-cols-12 gap-1">
              {(A?.heatmap && A.heatmap.length ? A.heatmap : HEATMAP).flat().map((v, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 12) * 0.015 }}
                  className="aspect-square rounded-[3px]"
                  style={{ background: v === 0 ? R(p.line, 0.5) : R(p.wine, 0.12 + (v / 10) * 0.85) }}
                  title={`${v} events`}
                />
              ))}
            </div>
            <div className="mt-2 text-right text-[10px] text-faint">last 12 weeks</div>
          </div>
        </Reveal>
      </div>

      <Reveal>
        <div className="card p-5">
          <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Upcoming deadlines</h3>
          <div className="divide-y divide-line">
            {deadlines.map((d) => {
              const days = daysUntil(d.due);
              return (
                <div key={d.label} className="flex items-center gap-3 py-2.5">
                  <span className={`w-20 shrink-0 font-mono text-[12px] font-semibold ${days < 7 ? 'text-rust' : days < 21 ? 'text-amber' : 'text-faint'}`}>
                    {days}d
                  </span>
                  <span className="hidden w-20 shrink-0 text-[11px] tracking-wide text-faint uppercase sm:block">{d.kind}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink-2">{d.label}</span>
                  <span className="shrink-0 text-[12px] text-faint">{fmtDate(d.due)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
