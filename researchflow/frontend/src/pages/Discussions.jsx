import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, MessageSquare, Pin, Plus, Send } from 'lucide-react';
import { useSession } from '../lib/session';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, Field, Modal, Reveal } from '../components/ui';
import { cn, relTime } from '../lib/utils';

const EMOJIS = ['👍', '💡', '🙏', '📅'];

export default function Discussions({ global = false }) {
  const { id } = useParams();
  const [projectId, setProjectId] = useState(global ? 'p1' : id);
  const { session } = useSession();
  const { work, user, actions } = useWork();
  const toast = useToast();
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', body: '' });

  const threads = work.discussions
    .filter((d) => d.projectId === projectId)
    .sort((a, b) => (b.pinned - a.pinned) || +new Date(b.date) - +new Date(a.date));
  const isSupervisor = ['supervisor', 'admin'].includes(session.role);

  const activeThread = threads.find((t) => t.id === active) || threads[0];

  const post = (e) => {
    e?.preventDefault();
    if (!reply.trim() || !activeThread) return;
    actions.addReply(activeThread.id, reply);
    setReply('');
    toast('Reply posted');
  };

  const create = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    actions.addThread({ projectId, title: f.title, body: f.body });
    setOpen(false);
    setF({ title: '', body: '' });
    toast('Discussion started');
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      {/* Thread list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-faint">{threads.length} threads</p>
          <button className="btn-soft px-3 py-1.5 text-[12.5px]" onClick={() => setOpen(true)}>
            <Plus size={13} /> New Thread
          </button>
        </div>
        {threads.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={cn(
              'card w-full p-4 text-left transition-all',
              activeThread?.id === t.id ? 'border-wine/40 shadow-lift' : 'hover:shadow-soft'
            )}
          >
            <div className="flex items-center gap-2">
              {t.pinned && <Pin size={12} className="shrink-0 text-copper" />}
              {t.resolved && <Check size={12} className="shrink-0 text-moss" />}
              <span className={cn('truncate text-[13.5px] font-semibold', t.resolved ? 'text-faint' : 'text-ink')}>{t.title}</span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-faint">{t.body}</p>
            <div className="mt-2.5 flex items-center gap-2 text-[11px] text-faint">
              <Avatar name={user(t.by)?.name || 'You'} size={18} />
              <span>{t.replies.length} replies</span>
              <span className="ml-auto">{relTime(t.date)}</span>
            </div>
          </button>
        ))}
        {global && (
          <div className="border-t border-line pt-4">
            <span className="label">Project</span>
            <select className="input py-2 text-[13px]" value={projectId} onChange={(e) => { setProjectId(e.target.value); setActive(null); }}>
              {work.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Thread detail */}
      {activeThread ? (
        <div className="card flex flex-col overflow-hidden">
          <div className="border-b border-line px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              {activeThread.pinned && <Badge tone="copper"><Pin size={10} /> Pinned</Badge>}
              {activeThread.resolved && <Badge tone="moss"><Check size={10} /> Resolved</Badge>}
              <h2 className="font-display text-[17px] font-semibold text-ink">{activeThread.title}</h2>
            </div>
            <div className="mt-3 flex items-start gap-3">
              <Avatar name={user(activeThread.by)?.name || 'You'} size={32} />
              <div className="flex-1 rounded-xl rounded-tl-sm border border-line bg-card-2/50 px-4 py-3">
                <div className="flex items-center justify-between text-[11px] text-faint">
                  <span className="font-medium text-ink-2">{user(activeThread.by)?.name || 'You'}</span>
                  <span>{relTime(activeThread.date)}</span>
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{activeThread.body}</p>
              </div>
            </div>
            {isSupervisor && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { actions.toggleThreadFlag(activeThread.id, 'pinned'); toast(activeThread.pinned ? 'Unpinned' : 'Discussion pinned'); }}
                  className={cn('btn-ghost px-2.5 py-1.5 text-[12px]', activeThread.pinned && 'text-copper')}
                >
                  <Pin size={12} /> {activeThread.pinned ? 'Unpin' : 'Pin'}
                </button>
                <button
                  onClick={() => { actions.toggleThreadFlag(activeThread.id, 'resolved'); toast(activeThread.resolved ? 'Reopened' : 'Marked as resolved'); }}
                  className={cn('btn-ghost px-2.5 py-1.5 text-[12px]', activeThread.resolved && 'text-moss')}
                >
                  <Check size={12} /> {activeThread.resolved ? 'Reopen' : 'Resolve'}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {activeThread.replies.map((r) => {
              const u = user(r.by) || { name: 'You' };
              return (
                <div key={r.id} className="flex gap-3">
                  <Avatar name={u.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-faint">
                      <span className="font-medium text-ink-2">{u.name}</span>
                      <span>{relTime(r.date)}</span>
                    </div>
                    <div className="mt-1.5 rounded-xl rounded-tl-sm border border-line bg-card-2/40 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
                      {r.body}
                    </div>
                    <div className="mt-1.5 flex gap-1.5">
                      {EMOJIS.map((em) => {
                        const count = r.reactions?.[em] || 0;
                        const mine = r.mine?.[em];
                        return (
                          <button
                            key={em}
                            onClick={() => actions.toggleReaction(activeThread.id, r.id, em)}
                            className={cn(
                              'flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition',
                              mine ? 'border-wine/40 bg-wine-soft text-wine' : count > 0 ? 'border-line bg-card text-ink-2' : 'border-transparent text-faint opacity-60 hover:opacity-100'
                            )}
                          >
                            {em} {count > 0 && count}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={post} className="flex items-center gap-2 border-t border-line px-5 py-3.5">
            <input
              className="input flex-1"
              placeholder="Write a reply… (use @name to mention)"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              aria-label="Reply"
            />
            <button type="submit" className="btn-primary px-3.5" disabled={!reply.trim()} aria-label="Post reply">
              <Send size={15} />
            </button>
          </form>
        </div>
      ) : (
        <div className="card flex items-center justify-center p-10 text-sm text-faint">
          Select a discussion to read the thread.
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Start a discussion"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={create}><Plus size={14} /> Create Thread</button>
          </>
        }
      >
        <form onSubmit={create} className="space-y-4" noValidate>
          <Field label="Title" required>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Dataset Quality Discussion" autoFocus />
          </Field>
          <Field label="Opening post">
            <textarea className="input min-h-[100px]" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Context, question or decision to discuss…" />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
