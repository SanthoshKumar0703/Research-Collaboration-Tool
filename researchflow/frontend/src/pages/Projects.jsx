import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, FolderOpen, Plus, Tag } from 'lucide-react';
import { useSession } from '../lib/session';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { AvatarStack, Badge, Field, Modal, PageHeader, Progress, Reveal, StatusPill } from '../components/ui';
import { fmtDate } from '../lib/utils';

export default function Projects() {
  const { session } = useSession();
  const { work, actions, user } = useWork();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', desc: '', objective: '', methodology: '', start: '', end: '', status: 'Planning', priority: 'Medium', category: '', tags: '' });
  const canCreate = session.role !== 'researcher';

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    actions.addProject({
      title: f.title,
      desc: f.desc,
      objective: f.objective,
      methodology: f.methodology,
      start: f.start || new Date().toISOString().slice(0, 10),
      end: f.end || new Date(Date.now() + 200 * 86400000).toISOString().slice(0, 10),
      status: f.status,
      priority: f.priority,
      category: f.category || 'General',
      tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setOpen(false);
    setF({ ...f, title: '', desc: '', objective: '', methodology: '', start: '', end: '', category: '', tags: '' });
    toast(`Project “${f.title}” created`);
  };

  return (
    <div className="mx-auto max-w-[1200px] p-5 lg:p-8">
      <PageHeader
        title={session.role === 'researcher' ? 'My Projects' : 'Projects'}
        sub={`${work.projects.length} research workspaces · ${work.projects.filter((p) => p.status === 'Active').length} active`}
        actions={
          canCreate ? (
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={15} /> New Project
            </button>
          ) : (
            <Badge tone="neutral">Projects are created by supervisors</Badge>
          )
        }
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {work.projects.map((pr, i) => (
          <Reveal key={pr.id} delay={i * 0.07}>
            <Link
              to={`/app/projects/${pr.id}`}
              className="card group flex h-full flex-col p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-wine-soft text-wine">
                  <FolderOpen size={18} />
                </span>
                <StatusPill status={pr.status} />
              </div>
              <h3 className="mt-4 font-display text-[17px] leading-snug font-semibold text-ink group-hover:text-wine">
                {pr.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-faint">{pr.desc}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="copper">{pr.category}</Badge>
                {pr.tags.slice(0, 2).map((t) => (
                  <span key={t} className="chip font-mono text-[10.5px]">#{t}</span>
                ))}
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex justify-between text-[11.5px]">
                  <span className="text-faint">Progress</span>
                  <span className="font-medium text-ink-2">{pr.progress}%</span>
                </div>
                <Progress value={pr.progress} height={5} />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                <AvatarStack names={pr.members.map((m) => (m === 'me' ? session.name : user(m)?.name || 'Member'))} size={26} />
                <span className="flex items-center gap-1.5 text-[11.5px] text-faint">
                  <Calendar size={12} /> {fmtDate(pr.end)}
                </span>
              </div>
            </Link>
          </Reveal>
        ))}

        {canCreate && (
          <Reveal delay={0.2}>
            <button
              onClick={() => setOpen(true)}
              className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-line-2 text-faint transition hover:border-wine/40 hover:text-wine"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-2">
                <Plus size={19} />
              </span>
              <span className="text-sm font-medium">Start a new research project</span>
            </button>
          </Reveal>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create research project"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={submit}>Create Project</button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Project Title" required>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="AI-Based Disease Prediction" />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-[70px]" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="What is this research about?" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Research Objective">
              <textarea className="input min-h-[64px]" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} placeholder="The measurable goal" />
            </Field>
            <Field label="Methodology">
              <textarea className="input min-h-[64px]" value={f.methodology} onChange={(e) => setF({ ...f, methodology: e.target.value })} placeholder="How you will approach it" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Date">
              <input type="date" className="input" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
            </Field>
            <Field label="Expected Completion">
              <input type="date" className="input" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Status">
              <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
                {['Planning', 'Active', 'On Hold', 'Completed'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                {['High', 'Medium', 'Low'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Research Category">
              <input className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="Medical AI" />
            </Field>
          </div>
          <Field label="Tags" hint="Comma separated">
            <div className="relative">
              <Tag size={14} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
              <input className="input pl-9" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="deep-learning, diagnostics" />
            </div>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
