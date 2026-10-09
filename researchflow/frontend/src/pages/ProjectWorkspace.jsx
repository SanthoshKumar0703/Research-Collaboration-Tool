import React from 'react';
import { Link, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { useWork } from '../lib/work';
import { AvatarStack, Badge, Progress, Ring, StatusPill, Tabs } from '../components/ui';
import { fmtDate } from '../lib/utils';

const TABS = [
  { id: '', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'documents', label: 'Documents' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'findings', label: 'Findings' },
  { id: 'team', label: 'Team' },
  { id: 'discussions', label: 'Discussions' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'activity', label: 'Activity' },
];

export default function ProjectWorkspace() {
  const { id } = useParams();
  const { project, user } = useWork();
  const nav = useNavigate();
  const proj = project(id);
  if (!proj) return <Navigate to="/app/projects" replace />;

  const current = TABS.map((t) => (t.id === '' ? '' : t.id)).find((t) => {
    const path = `/app/projects/${id}${t ? `/${t}` : ''}`;
    return location.pathname === path;
  });
  const activeTab = TABS.find((t) => t.id === (current ?? ''))?.id ?? '';

  return (
    <div className="mx-auto max-w-[1200px] p-5 lg:p-8">
      <Link to="/app/projects" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-faint transition hover:text-wine">
        <ArrowLeft size={13} /> All projects
      </Link>

      <div className="card mb-6 p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] leading-tight font-semibold tracking-tight text-ink lg:text-2xl">{proj.title}</h1>
              <StatusPill status={proj.status} />
              <Badge tone={proj.priority === 'High' ? 'rust' : proj.priority === 'Medium' ? 'amber' : 'neutral'}>{proj.priority} priority</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ink-2">{proj.desc}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-faint">
              <span>{proj.category}</span>
              <span>·</span>
              <span>{fmtDate(proj.start)} → {fmtDate(proj.end)}</span>
              {proj.tags.map((t) => (
                <span key={t} className="font-mono text-[11px]">#{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="mb-1.5 text-[11px] font-medium tracking-wide text-faint uppercase">Overall progress</div>
              <div className="w-36">
                <Progress value={proj.progress} />
              </div>
              <div className="mt-1.5 text-[11px] text-faint">
                {proj.members.length} members · {fmtDate(proj.end)}
              </div>
            </div>
            <Ring value={proj.progress} size={64} stroke={5.5} />
          </div>
        </div>
      </div>

      <Tabs
        items={TABS}
        active={activeTab}
        onChange={(tid) => nav(tid ? `/app/projects/${id}/${tid}` : `/app/projects/${id}`)}
        className="mb-6"
      />

      <Outlet />
    </div>
  );
}
