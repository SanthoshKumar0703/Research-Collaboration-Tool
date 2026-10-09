import React, { useState } from 'react';
import { Calendar, Check, FolderOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, EmptyState, Progress, StatusPill } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { cn, daysUntil, fmtDateShort } from '../lib/utils';

const NEXT = { todo: 'in_progress', in_progress: 'review', review: 'completed', completed: 'todo' };
const NEXT_LABEL = { todo: 'Start', in_progress: 'Send to review', review: 'Mark completed', completed: 'Reopen' };

export default function MyTasks() {
  const { work, user, actions } = useWork();
  const toast = useToast();
  const [filter, setFilter] = useState('open');

  const mine = work.tasks
    .filter((t) => t.assignee === 'u1')
    .filter((t) => (filter === 'all' ? true : filter === 'open' ? t.status !== 'completed' : t.status === 'completed'));

  const groups = work.projects
    .map((p) => ({ project: p, tasks: mine.filter((t) => t.projectId === p.id) }))
    .filter((g) => g.tasks.length > 0);

  const total = work.tasks.filter((t) => t.assignee === 'u1');
  const done = total.filter((t) => t.status === 'completed').length;

  return (
    <div className="mx-auto max-w-[1000px]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink lg:text-[28px]">My Tasks</h1>
          <p className="mt-1 text-sm text-faint">{done} of {total.length} completed across {work.projects.length} projects</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40">
            <Progress value={total.length ? (done / total.length) * 100 : 0} height={5} />
          </div>
          <select className="input w-auto py-2 text-[12.5px]" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter tasks">
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Check}
          title="You're all caught up."
          desc="No tasks match this filter. New assignments will appear here in real time."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.project.id} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-card-2/60 px-5 py-3">
                <Link to={`/app/projects/${g.project.id}`} className="flex items-center gap-2 text-[13px] font-semibold text-ink transition hover:text-wine">
                  <FolderOpen size={14} className="text-copper" /> {g.project.title}
                </Link>
                <Badge tone="neutral">{g.tasks.length} tasks</Badge>
              </div>
              <div className="divide-y divide-line">
                {g.tasks.map((t) => {
                  const overdue = t.status !== 'completed' && daysUntil(t.due) < 0;
                  const reviewer = user(t.assignee);
                  return (
                    <div key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-ink/2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn('truncate text-[13.5px] font-medium', t.status === 'completed' ? 'text-faint line-through' : 'text-ink')}>
                            {t.title}
                          </span>
                          <StatusPill status={t.status.replace('_', ' ')} />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-faint">
                          <span>{t.priority} priority</span>
                          <span className={cn('flex items-center gap-1', overdue && 'font-semibold text-rust')}>
                            <Calendar size={11} /> due {fmtDateShort(t.due)}
                          </span>
                          <span>{t.comments} comments</span>
                        </div>
                      </div>
                      <Avatar name={reviewer?.name || 'You'} size={26} />
                      <button
                        onClick={() => {
                          const next = NEXT[t.status];
                          actions.moveTask(t.id, next);
                          toast(`“${t.title}” → ${next.replace('_', ' ')}`);
                          browserNotify('Task updated', `${t.title} → ${NEXT_LABEL[t.status]}`);
                        }}
                        className="btn-soft px-3 py-1.5 text-[12px]"
                      >
                        {NEXT_LABEL[t.status]}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
