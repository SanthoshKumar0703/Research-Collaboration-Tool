import React from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { useWork } from '../lib/work';
import { Badge, Progress, Reveal, StatusPill } from '../components/ui';
import { fmtDate } from '../lib/utils';

export default function Milestones({ projectId = 'p1' }) {
  const { work } = useWork();
  const milestones = work.milestones.filter((m) => m.projectId === projectId);
  const avg = Math.round(milestones.reduce((a, m) => a + m.progress, 0) / (milestones.length || 1));

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[13px] text-faint">
          {milestones.filter((m) => m.status === 'Completed').length} of {milestones.length} milestones completed · {avg}% overall
        </p>
        <Badge tone={avg >= 70 ? 'moss' : 'amber'} dot>{avg >= 70 ? 'On track' : 'Needs attention'}</Badge>
      </div>

      <div className="relative space-y-4">
        <div className="absolute top-4 bottom-4 left-[19px] hidden w-px bg-line-2 sm:block" />
        {milestones.map((m, i) => {
          const related = work.tasks.filter((t) => t.milestone === m.id);
          return (
            <Reveal key={m.id} delay={i * 0.05}>
              <div className="relative flex gap-4 sm:gap-5">
                <div className="relative z-10 hidden shrink-0 sm:block">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      m.status === 'Completed'
                        ? 'border-moss bg-moss text-white'
                        : m.status === 'In Progress'
                        ? 'border-wine bg-wine-soft text-wine'
                        : m.status === 'Delayed'
                        ? 'border-rust bg-rust/10 text-rust'
                        : 'border-line-2 bg-card text-faint'
                    }`}
                  >
                    {m.status === 'Completed' ? <CheckCircle2 size={17} /> : m.status === 'In Progress' ? <Clock size={16} /> : i + 1}
                  </span>
                </div>
                <div className="card flex-1 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="font-display text-[16px] font-semibold text-ink">{m.name}</h3>
                        <StatusPill status={m.status} />
                      </div>
                      <p className="mt-1.5 text-[13px] text-ink-2">{m.desc}</p>
                    </div>
                    <div className="text-right text-[11.5px] text-faint">
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar size={12} /> {fmtDate(m.start)} → {fmtDate(m.due)}
                      </div>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <ListChecks size={12} /> {related.length} related tasks · {related.filter((t) => t.status === 'completed').length} done
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={m.progress} tone={m.status === 'Completed' ? 'moss' : m.status === 'In Progress' ? 'wine' : 'copper'} className="flex-1" height={6} />
                    <span className="w-10 text-right font-mono text-[12px] font-semibold text-ink-2">{m.progress}%</span>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
