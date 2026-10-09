import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Check, GripVertical, MessageSquare, Paperclip, Plus } from 'lucide-react';
import { useWork } from '../lib/work';
import { hasApi } from '../lib/api';
import { useToast } from '../lib/toast';
import { Avatar, Badge, Field, Modal, Progress } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { cn, daysUntil, fmtDateShort } from '../lib/utils';

const COLS = [
  { id: 'todo', label: 'To Do', accent: 'bg-line-2' },
  { id: 'in_progress', label: 'In Progress', accent: 'bg-amber' },
  { id: 'review', label: 'Review', accent: 'bg-copper' },
  { id: 'completed', label: 'Completed', accent: 'bg-moss' },
];

const PRI = {
  High: 'text-rust border-rust/30 bg-rust/5',
  Medium: 'text-amber border-amber/30 bg-amber/5',
  Low: 'text-faint border-line bg-transparent',
};

export default function TasksBoard({ projectId = 'p1' }) {
  const { work, user, actions, meId, mode } = useWork();
  const toast = useToast();
  const live = mode === 'api';
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [addFor, setAddFor] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [f, setF] = useState({ title: '', desc: '', assignee: hasApi() ? null : 'u1', priority: 'Medium', due: '', milestone: '' });

  const tasks = useMemo(
    () =>
      work.tasks.filter(
        (t) => t.projectId === projectId && (filterAssignee === 'all' || t.assignee === filterAssignee)
      ),
    [work.tasks, projectId, filterAssignee]
  );
  const total = work.tasks.filter((t) => t.projectId === projectId).length;
  const done = work.tasks.filter((t) => t.projectId === projectId && t.status === 'completed').length;

  const onDrop = (col) => {
    if (dragId) {
      const task = work.tasks.find((t) => t.id === dragId);
      if (task && task.status !== col) {
        actions.moveTask(dragId, col);
        const label = COLS.find((c) => c.id === col).label;
        toast(`Task moved to ${label}`);
        browserNotify('Task updated', `“${task.title}” → ${label}`);
      }
    }
    setDragId(null);
    setOverCol(null);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    actions.addTask({
      projectId,
      title: f.title,
      desc: f.desc,
      assignee: f.assignee || (live ? meId : 'u1'),
      priority: f.priority,
      due: f.due || new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      milestone: f.milestone,
      status: addFor || 'todo',
    });
    setAddFor(null);
    setF({ ...f, title: '', desc: '', due: '', milestone: '' });
  };

  const members = ['u1', 'u2', 'u3'].map((m) => user(m)).filter(Boolean);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-[12px] font-medium text-faint">
              {done} of {total} tasks completed
            </div>
            <div className="mt-1 w-40">
              <Progress value={total ? (done / total) * 100 : 0} height={5} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input w-auto py-2 text-[12.5px]"
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            aria-label="Filter by assignee"
          >
            <option value="all">All assignees</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button className="btn-primary py-2 text-[13px]" onClick={() => setAddFor('todo')}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLS.map((col) => {
          const list = tasks.filter((t) => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.id); }}
              onDragLeave={(e) => { if (e.currentTarget === e.target) setOverCol(null); }}
              onDrop={() => onDrop(col.id)}
              className={cn(
                'flex min-h-[300px] flex-col rounded-xl border bg-paper-soft/40 transition-colors',
                overCol === col.id ? 'border-wine/50 bg-wine-soft/30' : 'border-line'
              )}
            >
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <span className={cn('h-2 w-2 rounded-full', col.accent)} />
                <span className="text-[12px] font-semibold tracking-wide text-ink-2 uppercase">{col.label}</span>
                <span className="rounded-full bg-ink/6 px-1.5 py-px text-[10.5px] font-medium text-faint dark:bg-white/10">{list.length}</span>
                <button
                  onClick={() => setAddFor(col.id)}
                  className="ml-auto rounded-md p-1 text-faint transition hover:bg-ink/5 hover:text-ink"
                  aria-label={`Add task to ${col.label}`}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="flex-1 space-y-2.5 px-3 pb-3">
                {list.map((t) => {
                  const assignee = user(t.assignee) || { name: 'You' };
                  const overdue = t.status !== 'completed' && daysUntil(t.due) < 0;
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        setDragId(t.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      className={cn(
                        'card group cursor-grab p-3.5 transition-all duration-200 active:cursor-grabbing hover:shadow-lift',
                        dragId === t.id && 'opacity-50'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="mt-0.5 shrink-0 text-faint/50 group-hover:text-faint" />
                        <p className={cn('flex-1 text-[13px] leading-snug font-medium text-ink', t.status === 'completed' && 'text-faint line-through')}>
                          {t.title}
                        </p>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className={cn('rounded-md border px-1.5 py-px text-[10px] font-semibold', PRI[t.priority])}>{t.priority}</span>
                        {t.milestone && (
                          <span className="rounded-md border border-line bg-card-2 px-1.5 py-px text-[10px] text-faint">
                            {work.milestones.find((m) => m.id === t.milestone)?.name || 'Milestone'}
                          </span>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
                        <Avatar name={assignee.name} size={22} />
                        <div className="flex items-center gap-2.5 text-[10.5px] text-faint">
                          <span className="flex items-center gap-1">
                            <MessageSquare size={11} /> {t.comments}
                          </span>
                          {t.attachments > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip size={11} /> {t.attachments}
                            </span>
                          )}
                          <span className={cn('flex items-center gap-1', overdue && 'font-semibold text-rust')}>
                            <Calendar size={11} /> {fmtDateShort(t.due)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {list.length === 0 && (
                  <div className="rounded-lg border border-dashed border-line-2 px-3 py-6 text-center text-[11.5px] text-faint">
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={!!addFor}
        onClose={() => setAddFor(null)}
        title={`New task · ${COLS.find((c) => c.id === addFor)?.label}`}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setAddFor(null)}>Cancel</button>
            <button className="btn-primary" onClick={submit}><Check size={14} /> Create Task</button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Title" required>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Validate fold-3 results" autoFocus />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-[70px]" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="What does done look like?" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Assignee">
              <select className="input" value={f.assignee} onChange={(e) => setF({ ...f, assignee: e.target.value })}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Priority">
              <select className="input" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
                {['High', 'Medium', 'Low'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Due date">
              <input type="date" className="input" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
            </Field>
            <Field label="Milestone">
              <select className="input" value={f.milestone} onChange={(e) => setF({ ...f, milestone: e.target.value })}>
                <option value="">None</option>
                {work.milestones.filter((m) => m.projectId === projectId).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-[11.5px] text-faint">
            Creating a task logs the activity, notifies the assignee and updates project progress in real time.
          </p>
        </form>
      </Modal>
    </div>
  );
}
