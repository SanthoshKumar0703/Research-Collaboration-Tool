import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ArrowRight, CalendarClock, CheckCircle2, Flag, Target } from 'lucide-react';
import { useWork } from '../lib/work';
import { Avatar, Badge, Progress, Reveal, StatusPill } from '../components/ui';
import { JOURNEY_STEPS } from '../lib/mock';
import { fmtDate, fmtDateShort, relTime } from '../lib/utils';

export default function Overview() {
  const { id } = useParams();
  const { work, project, user } = useWork();
  const proj = project(id);
  if (!proj) return null;

  const milestones = work.milestones.filter((m) => m.projectId === id);
  const currentMilestone = milestones.find((m) => m.status === 'In Progress') || milestones[0];
  const tasks = work.tasks.filter((t) => t.projectId === id);
  const doneTasks = tasks.filter((t) => t.status === 'completed').length;
  const docs = work.documents.filter((d) => d.projectId === id);
  const upcomingDeadline = [...milestones, ...tasks]
    .filter((x) => x.due && new Date(x.due) > new Date())
    .sort((a, b) => new Date(a.due) - new Date(b.due))[0];

  // progress of each journey phase from milestones
  const journeyState = [
    { name: 'Idea', done: true },
    { name: 'Literature Review', done: milestones[0]?.status === 'Completed' },
    { name: 'Dataset Preparation', done: milestones[1]?.status === 'Completed' },
    { name: 'Experimentation', done: false, active: currentMilestone?.name === 'Model Development' },
    { name: 'Analysis', done: false, active: currentMilestone?.name === 'Model Evaluation' },
    { name: 'Final Research', done: false },
  ];

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {/* Research timeline */}
        <Reveal>
          <div className="card p-6">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-[16px] font-semibold text-ink">Research timeline</h3>
              <Badge tone="wine" dot>Phase 4 of 6</Badge>
            </div>
            <div className="relative">
              <div className="absolute top-[13px] right-4 left-4 hidden h-px bg-line-2 lg:block">
                <motion.div
                  className="h-full bg-wine"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 1.4, delay: 0.2, ease: 'easeInOut' }}
                  style={{ width: '62%' }}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6 lg:gap-3">
                {journeyState.map((j, i) => (
                  <div key={j.name} className="relative text-center lg:text-left">
                    <div className="flex justify-center lg:justify-start">
                      <span
                        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 text-[11px] font-semibold ${
                          j.done
                            ? 'border-moss bg-moss text-white'
                            : j.active
                            ? 'border-wine bg-wine text-[rgb(var(--c-on-accent))] shadow-soft'
                            : 'border-line-2 bg-card text-faint'
                        }`}
                      >
                        {j.done ? <CheckCircle2 size={13} className="text-white" /> : i + 1}
                        {j.active && (
                          <motion.span
                            className="absolute inset-0 -m-1.5 rounded-full border-2 border-wine/40"
                            animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </span>
                    </div>
                    <div className={`mt-2.5 text-[12px] leading-snug font-medium ${j.done || j.active ? 'text-ink' : 'text-faint'}`}>
                      {j.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Objective + methodology */}
        <Reveal delay={0.08}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center gap-2 text-wine">
                <Target size={15} />
                <h3 className="text-[13px] font-semibold tracking-wide uppercase">Research objective</h3>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{proj.objective}</p>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-2 text-copper">
                <Activity size={15} />
                <h3 className="text-[13px] font-semibold tracking-wide uppercase">Methodology</h3>
              </div>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{proj.methodology}</p>
            </div>
          </div>
        </Reveal>

        {/* Current milestone + deadline */}
        <Reveal delay={0.12}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="card p-5">
              <div className="text-[11px] font-semibold tracking-wider text-faint uppercase">Current milestone</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-display text-[16px] font-semibold text-ink">{currentMilestone?.name}</span>
                <StatusPill status={currentMilestone?.status} />
              </div>
              <div className="mt-3">
                <Progress value={currentMilestone?.progress || 0} height={6} />
              </div>
              <div className="mt-2 text-[11.5px] text-faint">Due {currentMilestone ? fmtDate(currentMilestone.due) : '—'}</div>
              <Link to={`/app/projects/${id}/milestones`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-wine hover:underline">
                View all milestones <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card p-5">
              <div className="text-[11px] font-semibold tracking-wider text-faint uppercase">Upcoming deadline</div>
              {upcomingDeadline ? (
                <>
                  <div className="mt-2 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber/10 text-amber">
                      <CalendarClock size={17} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-semibold text-ink">
                        {upcomingDeadline.title || upcomingDeadline.name}
                      </div>
                      <div className="mt-0.5 text-[12px] text-faint">Due {fmtDate(upcomingDeadline.due)}</div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-3 text-[13px] text-faint">No deadlines on the horizon.</p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
                {[
                  [tasks.length, 'tasks'],
                  [doneTasks, 'completed'],
                  [docs.length, 'documents'],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display text-xl font-semibold text-ink">{n}</div>
                    <div className="text-[10.5px] tracking-wide text-faint uppercase">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* Right rail */}
      <div className="space-y-5">
        <Reveal delay={0.1}>
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-ink">Team</h3>
              <Link to={`/app/projects/${id}/team`} className="text-xs font-medium text-wine hover:underline">Open</Link>
            </div>
            <div className="space-y-3">
              {proj.members.map((m) => {
                const u = user(m) || { name: 'You', role: 'Researcher' };
                return (
                  <div key={m} className="flex items-center gap-3">
                    <Avatar name={u.name} size={34} online={m !== 'me'} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{u.name}</div>
                      <div className="truncate text-[11px] text-faint">{u.dept || 'Data Science'}</div>
                    </div>
                    <Badge tone={u.role === 'supervisor' ? 'copper' : 'neutral'}>{u.role}</Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.14}>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-ink">Recent activity</h3>
              <Link to={`/app/projects/${id}/activity`} className="text-xs font-medium text-wine hover:underline">All</Link>
            </div>
            <div className="space-y-3">
              {work.activity.filter((a) => a.projectId === id).slice(0, 5).map((a) => {
                const u = user(a.userId);
                return (
                  <div key={a.id} className="flex items-start gap-2.5 text-[12.5px] leading-snug">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-copper" />
                    <div>
                      <span className="font-medium text-ink">{u ? u.name : 'You'}</span>{' '}
                      <span className="text-ink-2">{a.verb}</span>
                      {a.noun && <span className="text-faint"> {a.noun}</span>}
                      <div className="mt-0.5 text-[10.5px] text-faint">{relTime(a.time)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.18}>
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-ink">Recent documents</h3>
              <Link to={`/app/projects/${id}/documents`} className="text-xs font-medium text-wine hover:underline">Library</Link>
            </div>
            <div className="space-y-2.5">
              {docs.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-wine-soft font-mono text-[9px] font-semibold text-wine uppercase">
                    {d.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-ink">{d.name}</div>
                    <div className="text-[10.5px] text-faint">v{d.version} · {fmtDateShort(d.date)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
