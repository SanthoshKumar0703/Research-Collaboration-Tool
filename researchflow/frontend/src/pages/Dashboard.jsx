import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, CalendarClock, CheckCircle2,
  ClipboardCheck, FileText, FlaskConical, FolderOpen, ListChecks, Plus,
  Sparkles, Users, UserPlus,
} from 'lucide-react';
import { useSession } from '../lib/session';
import { useWork, } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, PageHeader, Progress, Ring, Stat, StatusPill } from '../components/ui';
import { usePalette, R } from '../lib/palette';
import { fmtDateShort, relTime } from '../lib/utils';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { WEEKLY_ACTIVITY, ADMIN_LOGS, USER_GROWTH } from '../lib/mock';

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

const ACTIVITY_ICON = {
  uploaded: [FileText, 'bg-copper-soft text-copper'],
  created: [Plus, 'bg-wine-soft text-wine'],
  recorded: [FlaskConical, 'bg-moss/10 text-moss'],
  scheduled: [CalendarClock, 'bg-wine-soft text-wine'],
  approved: [CheckCircle2, 'bg-moss/10 text-moss'],
  added: [Sparkles, 'bg-gold-soft text-copper'],
  joined: [UserPlus, 'bg-ink/6 text-ink-2'],
  default: [Activity, 'bg-ink/6 text-ink-2'],
};

export default function Dashboard() {
  const { session } = useSession();
  const { work, user, users, actions, mode } = useWork();
  const live = mode === 'api';
  const toast = useToast();
  const p = usePalette();
  const role = session.role;
  const first = session.name.replace(/^Dr\.\s*/, '').split(' ')[0];
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  const p1 = work.projects[0] || { id: 'none', title: 'No projects yet', progress: 0 };
  const myTasks = work.tasks.filter((t) => t.projectId === p1.id && t.status !== 'completed');
  const pendingReviews = work.documents.filter((d) => ['Pending Review', 'Under Review', 'Changes Requested'].includes(d.review));
  const expsP1 = work.experiments.filter((e) => e.projectId === p1.id);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] p-5 lg:p-8">
      <PageHeader
        title={`${greeting}, ${first}.`}
        sub={`${today} · ${role === 'researcher' ? 'Researcher' : role === 'supervisor' ? 'Supervisor' : 'Administrator'} workspace`}
        actions={
          role === 'supervisor' || role === 'admin' ? (
            <Link to="/app/projects" className="btn-primary">
              <Plus size={15} /> New Project
            </Link>
          ) : (
            <Link to="/app/projects/p1/documents" className="btn-primary">
              <Plus size={15} /> Upload Document
            </Link>
          )
        }
      />

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {role === 'researcher' && (
          <>
            <Stat icon={FolderOpen} label="Active Projects" value={work.projects.filter((x) => x.status !== 'Planning').length} delta="+1 this quarter" />
            <Stat icon={BarChart3} label="Overall Progress" value={p1.progress} suffix="%" delta="+6% this month" />
            <Stat icon={ListChecks} label="Pending Tasks" value={myTasks.length} sub={`${myTasks.filter((t) => t.priority === 'High').length} high priority`} />
            <Stat icon={FlaskConical} label="Experiments" value={expsP1.length} sub={`${expsP1.filter((e) => e.status === 'Running').length} running`} />
          </>
        )}
        {role === 'supervisor' && (
          <>
            <Stat icon={FolderOpen} label="Total Projects" value={work.projects.length} delta="+1 this quarter" />
            <Stat icon={Users} label="Researchers" value={users.filter((u) => u.role === 'researcher').length} sub="across 3 institutions" />
            <Stat icon={ClipboardCheck} label="Pending Reviews" value={pendingReviews.length} deltaTone="rust" delta={`${pendingReviews.filter((d) => d.review === 'Changes Requested').length} changes requested`} />
            <Stat icon={AlertTriangle} label="Overdue Tasks" value={work.tasks.filter((t) => new Date(t.due) < new Date() && t.status !== 'completed').length} deltaTone="amber" delta="needs attention" />
          </>
        )}
        {role === 'admin' && (
          <>
            <Stat icon={Users} label="Total Users" value={users.length} delta="+2 this week" />
            <Stat icon={UserPlus} label="Researchers" value={users.filter((u) => u.role === 'researcher').length} sub={`${users.filter((u) => u.role === 'supervisor').length} supervisors`} />
            <Stat icon={FolderOpen} label="Active Projects" value={work.projects.filter((x) => x.status === 'Active').length} sub={`${work.projects.length} total`} />
            <Stat icon={FileText} label="Total Documents" value={work.documents.length * 4} sub="12.4 GB stored" />
          </>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="space-y-5 lg:col-span-2">
          {role === 'admin' ? (
            <>
              <div className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-[16px] font-semibold text-ink">User growth</h3>
                  <Badge tone="wine" dot>6 months</Badge>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={(live && work.globalAnalytics?.userGrowth) || USER_GROWTH} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                      <defs>
                        <linearGradient id="adminGrow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={R(p.wine)} stopOpacity={0.28} />
                          <stop offset="100%" stopColor={R(p.wine)} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={R(p.line, 0.55)} strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip />} cursor={{ stroke: R(p.line2) }} />
                      <Area type="monotone" dataKey="users" name="Users" stroke={R(p.wine)} strokeWidth={2.2} fill="url(#adminGrow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-[16px] font-semibold text-ink">Recent registrations</h3>
                  <Link to="/app/admin/users" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                    Manage users <ArrowRight size={12} />
                  </Link>
                </div>
                <div className="divide-y divide-line">
                  {[...users].slice(-4).reverse().map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-3">
                      <Avatar name={u.name} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium text-ink">{u.name}</div>
                        <div className="truncate text-xs text-faint">{u.institution}</div>
                      </div>
                      <Badge tone={u.role === 'researcher' ? 'neutral' : u.role === 'supervisor' ? 'copper' : 'wine'}>{u.role}</Badge>
                      <span className="text-xs text-faint">{relTime(u.joined)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-semibold text-ink">Research activity</h3>
                <span className="text-xs text-faint">last 12 weeks · {p1.title}</span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={(live && work.analytics?.[p1.id]?.weekly) || WEEKLY_ACTIVITY} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dashAct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={R(p.wine)} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={R(p.wine)} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="dashDoc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={R(p.copper)} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={R(p.copper)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={R(p.line, 0.55)} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: R(p.faint), fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<Tip />} cursor={{ stroke: R(p.line2) }} />
                    <Area type="monotone" dataKey="events" name="Events" stroke={R(p.wine)} strokeWidth={2.2} fill="url(#dashAct)" />
                    <Area type="monotone" dataKey="docs" name="Documents" stroke={R(p.copper)} strokeWidth={1.8} fill="url(#dashDoc)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* role-specific middle card */}
          {role === 'researcher' && (
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-semibold text-ink">Milestone progress</h3>
                <Link to="/app/projects/p1/milestones" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                  All milestones <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-4">
                {work.milestones.filter((m) => m.projectId === p1.id).slice(0, 4).map((m) => (
                  <div key={m.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                      <span className="font-medium text-ink-2">{m.name}</span>
                      <span className="text-faint">{m.progress}% · due {fmtDateShort(m.due)}</span>
                    </div>
                    <Progress value={m.progress} tone={m.status === 'Completed' ? 'moss' : m.status === 'In Progress' ? 'wine' : 'copper'} height={5} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'supervisor' && (
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-semibold text-ink">Research progress by project</h3>
                <Link to="/app/projects" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                  All projects <ArrowRight size={12} />
                </Link>
              </div>
              <div className="space-y-4">
                {work.projects.map((pr) => (
                  <div key={pr.id}>
                    <div className="mb-1.5 flex items-center justify-between text-[12.5px]">
                      <span className="truncate pr-3 font-medium text-ink-2">{pr.title}</span>
                      <span className="shrink-0 text-faint">{pr.progress}%</span>
                    </div>
                    <Progress value={pr.progress} height={6} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {role === 'admin' && (
            <div className="card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-[16px] font-semibold text-ink">System activity</h3>
                <Link to="/app/admin/activity" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                  Full log <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-line">
                {((live && work.globalAnalytics?.logs) || ADMIN_LOGS).slice(0, 5).map((l) => {
                  const u = user(l.userId);
                  return (
                    <div key={l.id} className="flex items-center gap-3 py-2.5 text-[12.5px]">
                      <span className="chip w-[118px] justify-center font-mono text-[10.5px]">{l.action.replace(/_/g, ' ')}</span>
                      <span className="min-w-0 flex-1 truncate text-ink-2">{l.target}</span>
                      <span className="text-[11px] text-faint">{u ? u.name.split(' ')[0] : 'system'} · {relTime(l.time)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right 1/3 */}
        <div className="space-y-5">
          {role === 'supervisor' && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h3 className="font-display text-[15px] font-semibold text-ink">Review queue</h3>
                <Link to="/app/reviews" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                  Open all <ArrowRight size={12} />
                </Link>
              </div>
              <div className="divide-y divide-line">
                {pendingReviews.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-copper-soft text-copper"><FileText size={14} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-ink">{doc.name}</div>
                        <div className="text-[11px] text-faint">
                          {user(doc.uploader)?.name || 'You'} · v{doc.version}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <StatusPill status={doc.review} />
                      <div className="flex gap-1.5">
                        <button onClick={() => toast('Opening document in review mode…', 'info')} className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-ink-2 hover:border-wine/40 hover:text-wine">Open</button>
                        <button
                          onClick={() => {
                            const { actions } = { actions: workActionsStub };
                            actionsStubApprove(doc.id, actions);
                          }}
                          className="rounded-md bg-moss/10 px-2 py-1 text-[11px] font-medium text-moss hover:bg-moss/20"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-ink">
                {role === 'researcher' ? 'Experiment status' : 'Experiment outcomes'}
              </h3>
              <Link to="/app/projects/p1/experiments" className="text-xs font-medium text-wine hover:underline">View</Link>
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: expsP1.filter((e) => e.status === 'Completed').length, fill: R(p.moss) },
                      { name: 'Running', value: expsP1.filter((e) => e.status === 'Running').length, fill: R(p.copper) },
                      { name: 'Under review', value: expsP1.filter((e) => e.status === 'Under Review').length, fill: R(p.gold) },
                      { name: 'Planned', value: expsP1.filter((e) => e.status === 'Planned').length, fill: R(p.line2) },
                      { name: 'Failed', value: expsP1.filter((e) => e.status === 'Failed').length, fill: R(p.rust) },
                    ]}
                    innerRadius={40}
                    outerRadius={62}
                    paddingAngle={3}
                    strokeWidth={0}
                    dataKey="value"
                  />
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-faint">
              {[
                ['Completed', 'moss'], ['Running', 'copper'], ['Under review', 'gold'], ['Planned', 'line2'], ['Failed', 'rust'],
              ].map(([l, t]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${t === 'moss' ? 'bg-moss' : t === 'copper' ? 'bg-copper' : t === 'gold' ? 'bg-gold' : t === 'line2' ? 'bg-line-2' : 'bg-rust'}`} />
                  {l}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-ink">Upcoming meetings</h3>
              <Link to="/app/meetings" className="text-xs font-medium text-wine hover:underline">All</Link>
            </div>
            <div className="space-y-3">
              {work.meetings.filter((m) => m.status === 'scheduled').slice(0, 2).map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-lg border border-line bg-card-2/50 p-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-wine text-[rgb(var(--c-on-accent))]">
                    <span className="text-[13px] leading-none font-bold">{new Date(m.date).getDate()}</span>
                    <span className="text-[8.5px] uppercase">{new Date(m.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-ink">{m.title}</div>
                    <div className="text-[11px] text-faint">{m.time} · {m.participants.length} participants</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-ink">Recent activity</h3>
              <Link to="/app/projects/p1/activity" className="text-xs font-medium text-wine hover:underline">Timeline</Link>
            </div>
            <div className="space-y-3.5">
              {work.activity.slice(0, 5).map((a) => {
                const u = user(a.userId);
                const [Icon, cls] = ACTIVITY_ICON[a.verb.slice(0, 8)] || ACTIVITY_ICON.default;
                return (
                  <div key={a.id} className="flex items-start gap-3">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cls}`}>
                      <Icon size={13} />
                    </span>
                    <div className="min-w-0 flex-1 text-[12.5px] leading-snug">
                      <span className="font-medium text-ink">{u ? u.name : 'You'}</span>{' '}
                      <span className="text-ink-2">{a.verb}</span>{a.noun && <span className="text-faint"> {a.noun}</span>}
                      <div className="mt-0.5 text-[10.5px] text-faint">{relTime(a.time)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
