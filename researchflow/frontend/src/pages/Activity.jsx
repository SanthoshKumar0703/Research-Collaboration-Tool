import React from 'react';
import { useParams } from 'react-router-dom';
import { Activity as ActivityIcon, CalendarClock, CheckCircle2, FileText, FlaskConical, MessagesSquare, Plus, Sparkles, UserPlus } from 'lucide-react';
import { useWork } from '../lib/work';
import { Avatar, Badge, Reveal } from '../components/ui';
import { cn, fmtTime, relTime } from '../lib/utils';

const ICONS = {
  uploaded: [FileText, 'bg-copper-soft text-copper'],
  created: [Plus, 'bg-wine-soft text-wine'],
  recorded: [FlaskConical, 'bg-moss/10 text-moss'],
  scheduled: [CalendarClock, 'bg-wine-soft text-wine'],
  approved: [CheckCircle2, 'bg-moss/10 text-moss'],
  added: [Sparkles, 'bg-gold-soft text-copper'],
  joined: [UserPlus, 'bg-ink/6 text-ink-2'],
  completed: [CheckCircle2, 'bg-moss/10 text-moss'],
  moved: [ActivityIcon, 'bg-ink/6 text-ink-2'],
  commented: [MessagesSquare, 'bg-gold-soft text-copper'],
  replied: [MessagesSquare, 'bg-gold-soft text-copper'],
  submitted: [FileText, 'bg-copper-soft text-copper'],
};

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return 'Earlier';
}

export default function Activity({ projectId = 'p1' }) {
  const { id } = useParams();
  const { work, user } = useWork();
  const pid = id || projectId;
  const events = work.activity
    .filter((a) => !a.projectId || a.projectId === pid)
    .sort((a, b) => +new Date(b.time) - +new Date(a.time));

  const groups = ['Today', 'Yesterday', 'Earlier'].map((g) => ({
    label: g,
    items: events.filter((e) => dayLabel(e.time) === g),
  })).filter((g) => g.items.length);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[13px] text-faint">{events.length} events · research timeline</p>
        <Badge tone="wine" dot>Live</Badge>
      </div>
      <div className="relative space-y-8">
        <div className="absolute top-2 bottom-2 left-[21px] w-px bg-line-2" />
        {groups.map((g) => (
          <div key={g.label}>
            <div className="relative z-10 mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-line-2 bg-card font-display text-[11px] font-semibold text-ink-2">
                {g.label === 'Earlier' ? '…' : g.label[0]}
              </span>
              <h3 className="font-display text-[15px] font-semibold text-ink">{g.label}</h3>
              <span className="text-[11.5px] text-faint">{g.items.length} events</span>
            </div>
            <div className="space-y-3">
              {g.items.map((a, i) => {
                const u = user(a.userId) || { name: 'You' };
                const [Icon, cls] = ICONS[a.verb.split(' ')[0]] || ICONS.default;
                return (
                  <Reveal key={a.id} delay={Math.min(i * 0.04, 0.2)}>
                    <div className="relative z-10 flex gap-3">
                      <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-paper', cls)}>
                        <Icon size={14} />
                      </span>
                      <div className="card flex-1 px-4 py-3">
                        <p className="text-[13px] leading-snug">
                          <span className="font-semibold text-ink">{u.name}</span>{' '}
                          <span className="text-ink-2">{a.verb}</span>{a.noun && <span className="text-faint"> {a.noun}</span>}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10.5px] text-faint">
                          <Avatar name={u.name} size={14} />
                          {a.projectId && (
                            <span>· {work.projects.find((p) => p.id === a.projectId)?.title.slice(0, 34)}</span>
                          )}
                          <span className="ml-auto">{fmtTime(a.time)} · {relTime(a.time)}</span>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
