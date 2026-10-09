import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, Field, Modal, PageHeader, Progress } from '../components/ui';
import { fmtDate, relTime } from '../lib/utils';

export default function Researchers() {
  const { work, users } = useWork();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState('');

  const researchers = users
    .filter((u) => u.role === 'researcher')
    .filter((u) => (u.name + u.institution + u.dept).toLowerCase().includes(q.toLowerCase()));

  const workload = (id) => {
    const t = work.tasks.filter((x) => x.assignee === id);
    const done = t.filter((x) => x.status === 'completed').length;
    return { total: t.length, done, pct: t.length ? Math.round((done / t.length) * 100) : 0 };
  };

  return (
    <div className="mx-auto max-w-[1050px]">
      <PageHeader
        title="Researchers"
        sub={`${users.filter((u) => u.role === 'researcher').length} researchers across your projects`}
        actions={
          <button className="btn-primary" onClick={() => setInvite(true)}>
            <UserPlus size={15} /> Invite Researcher
          </button>
        }
      />

      <div className="relative mb-5 max-w-sm">
        <Search size={14} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
        <input className="input pl-9" placeholder="Search by name, institution…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1.4fr_1fr_0.7fr_0.7fr_1fr_0.6fr] gap-3 border-b border-line bg-card-2/60 px-5 py-2.5 text-[10.5px] font-semibold tracking-wider text-faint uppercase lg:grid">
          <span>Researcher</span><span>Projects</span><span>Tasks</span><span>Completed</span><span>Workload</span><span>Joined</span>
        </div>
        {researchers.map((u) => {
          const projects = work.projects.filter((p) => p.members.includes(u.id));
          const w = workload(u.id);
          return (
            <div key={u.id} className="grid grid-cols-1 gap-3 border-b border-line px-5 py-4 transition-colors last:border-0 hover:bg-ink/2 lg:grid-cols-[1.4fr_1fr_0.7fr_0.7fr_1fr_0.6fr] lg:items-center">
              <div className="flex items-center gap-3">
                <Avatar name={u.name} size={36} online />
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-medium text-ink">{u.name}</div>
                  <div className="truncate text-[11.5px] text-faint">{u.dept} · {u.institution}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {projects.slice(0, 2).map((p) => (
                  <Badge key={p.id} tone="neutral">{p.title.split(' ').slice(0, 2).join(' ')}</Badge>
                ))}
                {projects.length > 2 && <Badge tone="wine">+{projects.length - 2}</Badge>}
                {projects.length === 0 && <span className="text-[11.5px] text-faint">Not assigned yet</span>}
              </div>
              <div className="text-[13px] font-medium text-ink-2">{w.total}</div>
              <div className="text-[13px] text-moss">{w.done}</div>
              <div className="flex items-center gap-2.5">
                <Progress value={w.pct} className="w-24" height={4} tone={w.pct > 70 ? 'moss' : 'wine'} />
                <span className="font-mono text-[11px] text-faint">{w.pct}%</span>
              </div>
              <div className="text-[11.5px] text-faint">{fmtDate(u.joined)}</div>
            </div>
          );
        })}
        {researchers.length === 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-faint">No researchers match “{q}”.</div>
        )}
      </div>

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite researcher"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setInvite(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email.', 'err'); return; }
                setInvite(false);
                setEmail('');
                toast(`Invitation sent to ${email} (delivered via email in the backend phase)`);
              }}
            >
              <UserPlus size={14} /> Send Invite
            </button>
          </>
        }
      >
        <Field label="Email" hint="They’ll receive an invitation with a join link and a role of Researcher.">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="researcher@university.edu" autoFocus />
        </Field>
      </Modal>
    </div>
  );
}
