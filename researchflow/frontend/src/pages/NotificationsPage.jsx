import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, BellRing, Check, CheckCheck } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Badge, PageHeader } from '../components/ui';
import { requestBrowserPermission, browserNotify, notificationStatus } from '../lib/notify';
import { cn, relTime } from '../lib/utils';

const TYPE_META = {
  task: ['Tasks', 'bg-wine-soft text-wine'],
  doc: ['Documents', 'bg-copper-soft text-copper'],
  review: ['Documents', 'bg-copper-soft text-copper'],
  comment: ['Comments', 'bg-gold-soft text-copper'],
  meeting: ['Meetings', 'bg-wine-soft text-wine'],
  deadline: ['Deadlines', 'bg-amber/10 text-amber'],
  experiment: ['Experiments', 'bg-moss/10 text-moss'],
  finding: ['Experiments', 'bg-moss/10 text-moss'],
  discussion: ['Comments', 'bg-gold-soft text-copper'],
  system: ['System', 'bg-ink/6 text-ink-2'],
};

const FILTERS = ['All', 'Unread', 'Tasks', 'Documents', 'Comments', 'Meetings', 'Experiments', 'Deadlines'];

export default function NotificationsPage() {
  const { work, actions } = useWork();
  const toast = useToast();
  const [filter, setFilter] = useState('All');
  const [perm, setPerm] = useState(notificationStatus());

  const list = work.notifications
    .filter((n) => filter === 'All' ? true : filter === 'Unread' ? !n.read : TYPE_META[n.type]?.[0] === filter)
    .sort((a, b) => +new Date(b.time) - +new Date(a.time));

  const enable = async () => {
    const r = await requestBrowserPermission();
    setPerm(r);
    if (r === 'granted') {
      toast('Browser notifications enabled');
      browserNotify('ResearchFlow', 'Browser notifications are now active. You’ll be alerted about tasks, reviews and meetings.');
    } else if (r === 'denied') {
      toast('Notifications were blocked by the browser — allow them in site settings.', 'err');
    }
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        title="Notifications"
        sub={`${work.notifications.filter((n) => !n.read).length} unread · in-app, browser & email`}
        actions={
          <div className="flex gap-2">
            {perm !== 'granted' && (
              <button className="btn-soft" onClick={enable}>
                <BellRing size={14} /> Enable browser notifications
              </button>
            )}
            <button className="btn-outline" onClick={() => { actions.markAllRead(); toast('All marked as read'); }}>
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
        }
      />

      {perm === 'granted' && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-moss/25 bg-moss/5 px-4 py-3">
          <div className="flex items-center gap-2.5 text-[13px] text-ink-2">
            <BellRing size={15} className="text-moss" />
            Browser notifications are active on this device.
          </div>
          <button
            onClick={() => browserNotify('New Task Assigned', '“Tune CNN hyperparameters on fold 3” was assigned to you.')}
            className="text-[12px] font-medium text-wine hover:underline"
          >
            Send test notification
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
              filter === f ? 'border-wine/40 bg-wine-soft text-wine' : 'border-line bg-card text-ink-2 hover:border-line-2'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <AnimatePresence initial={false}>
          {list.map((n) => {
            const [, cls] = TYPE_META[n.type] || TYPE_META.system;
            return (
              <motion.button
                key={n.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => actions.markRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3.5 border-b border-line px-5 py-4 text-left transition last:border-0',
                  n.read ? 'opacity-75 hover:bg-ink/2' : 'bg-wine-soft/30 hover:bg-wine-soft/50'
                )}
              >
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', cls)}>
                  <Bell size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-wine" />}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-relaxed text-ink-2">{n.body}</span>
                  <span className="mt-1.5 block text-[10.5px] text-faint">{relTime(n.time)}</span>
                </span>
                {!n.read && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); actions.markRead(n.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); actions.markRead(n.id); } }}
                    className="mt-1 rounded-md border border-line px-2 py-1 text-[10.5px] font-medium text-ink-2 transition hover:border-wine/40 hover:text-wine"
                  >
                    Mark read
                  </span>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
        {list.length === 0 && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-line-2 text-faint">
              <Bell size={19} />
            </span>
            <p className="mt-3 font-display text-[15px] font-semibold text-ink">Nothing here.</p>
            <p className="mt-1 text-[12.5px] text-faint">No {filter.toLowerCase()} notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
