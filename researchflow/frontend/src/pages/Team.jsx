import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCheck, MessageSquare, Paperclip, Send, UserPlus, X } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, Field, Modal } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { api, hasApi, getToken, wsUrl } from '../lib/api';
import { cn, relTime } from '../lib/utils';

const DEMO_REPLIES = [
  'Good point — let me check the config and confirm.',
  'On it. I’ll post the numbers here in an hour.',
  'Agreed. Let’s take this to the sync tomorrow.',
  'Thanks — I’ve added it to the ablation plan.',
];

export default function Team({ global = false }) {
  const { id } = useParams();
  const { work, users, actions, mode, appendChat } = useWork();
  const toast = useToast();
  const live = mode === 'api';
  const [projectId, setProjectId] = useState(global ? null : id);
  const pid = projectId || work.projects[0]?.id || 'p1';
  const [wsLive, setWsLive] = useState(false);
  const proj = work.projects.find((p) => p.id === pid);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState('');
  const endRef = useRef(null);
  const replyIdx = useRef(0);

  const members = useMemo(
    () => (proj ? proj.members.map((m) => (m === 'me' ? { name: 'You', id: 'me' } : users.find((u) => u.id === m))).filter(Boolean) : []),
    [proj, users]
  );

  const messages = work.chats.filter((c) => c.projectId === pid);

  // Live channel (API mode): WebSocket into the project's chat room.
  useEffect(() => {
    if (!live || !pid) return;
    const url = wsUrl(`/ws/chat/${pid}?token=${encodeURIComponent(getToken() || '')}`);
    if (!url) return;
    let ws = null;
    let closed = false;
    const connect = () => {
      try {
        ws = new WebSocket(url);
      } catch {
        return;
      }
      ws.onopen = () => setWsLive(true);
      ws.onclose = () => {
        setWsLive(false);
        if (!closed) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'message') {
            appendChat(msg.data);
            const u = users.find((x) => x.id === msg.data.userId);
            if (msg.data.userId !== 'me') browserNotify(`${(u?.name || 'Someone').split(' ')[0]} replied`, msg.data.text);
          }
        } catch {}
      };
    };
    connect();
    return () => {
      closed = true;
      ws?.close();
    };
  }, [live, pid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, typing]);

  const send = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    actions.sendMessage(pid, t);
    setText('');
    if (live) return; // other members' replies arrive in real time over the WebSocket
    // Demo mode only: simulated teammate reply
    setTimeout(() => setTyping(true), 700);
    setTimeout(() => {
      setTyping(false);
      const others = users.filter((u) => proj?.members.includes(u.id));
      const who = others[replyIdx.current % Math.max(1, others.length)] || users[1];
      const reply = DEMO_REPLIES[replyIdx.current % DEMO_REPLIES.length];
      replyIdx.current += 1;
      actions.receiveMessage(pid, who.id, reply);
      browserNotify(`${who.name.split(' ')[0]} replied`, reply);
    }, 2600);
  };

  if (!proj) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
      {/* Members */}
      <div className="card h-fit p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-[15px] font-semibold text-ink">Members</h3>
          <Badge tone="moss" dot>{members.filter((m) => m.id !== 'me').length} online</Badge>
        </div>
        <div className="space-y-3.5">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3">
              <Avatar name={m.name} size={36} online={m.id !== 'me'} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-ink">{m.name}</div>
                <div className="truncate text-[11px] text-faint">{m.dept || 'Member'}{m.institution ? ` · ${m.institution.split(' ')[0]}` : ''}</div>
              </div>
              <Badge tone={m.role === 'supervisor' ? 'copper' : 'neutral'}>{m.role || 'researcher'}</Badge>
            </div>
          ))}
        </div>
        <button onClick={() => setInvite(true)} className="btn-soft mt-4 w-full text-[13px]">
          <UserPlus size={14} /> Invite member
        </button>
        {global && (
          <div className="mt-5 border-t border-line pt-4">
            <span className="label">Project</span>
            <select className="input py-2 text-[13px]" value={pid} onChange={(e) => setProjectId(e.target.value)}>
              {work.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className="card flex h-[560px] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <div className="text-[13.5px] font-semibold text-ink">Project chat</div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${wsLive || !live ? 'bg-moss' : 'bg-amber'}`} />
              {live ? (wsLive ? 'Live · ' : 'Reconnecting · ') : ''}
              {proj.title}
            </div>
          </div>
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => <Avatar key={m.id} name={m.name} size={26} ring />)}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.map((m) => {
            const u = users.find((x) => x.id === m.userId) || { name: 'You' };
            const mine = m.userId === 'me';
            return (
              <div key={m.id} className={cn('flex gap-2.5', mine && 'flex-row-reverse')}>
                <Avatar name={u.name} size={30} online={!mine} />
                <div className={cn('max-w-[75%]', mine && 'text-right')}>
                  <div className={cn('mb-1 flex items-center gap-2 text-[10.5px] text-faint', mine && 'justify-end')}>
                    <span className="font-medium text-ink-2">{u.name}</span>
                    <span>{relTime(m.date)}</span>
                    {mine && <span className="flex items-center gap-0.5 text-wine"><CheckCheck size={11} /> read</span>}
                  </div>
                  <div
                    className={cn(
                      'inline-block rounded-xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed',
                      mine ? 'rounded-tr-sm bg-wine text-[rgb(var(--c-on-accent))]' : 'rounded-tl-sm border border-line bg-card-2/70 text-ink-2'
                    )}
                  >
                    {m.text.split(/(@[A-Z][a-z]+ [A-Z][a-z]+)/g).map((part, i) =>
                      part.startsWith('@') ? <span key={i} className="font-semibold text-wine">{part}</span> : part
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2.5"
              >
                <Avatar name="Dr. Meera Nair" size={30} />
                <div className="flex items-center gap-1 rounded-xl rounded-tl-sm border border-line bg-card-2/70 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-faint"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={() => toast('File sharing uploads through the storage service in the backend phase.', 'info')}
            className="rounded-lg p-2 text-faint transition hover:bg-ink/5 hover:text-ink"
            aria-label="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <input
            className="input flex-1"
            placeholder={`Message ${proj.title.split(' ')[0]}…  (use @name to mention)`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Chat message"
          />
          <button type="submit" className="btn-primary px-3.5" disabled={!text.trim()} aria-label="Send message">
            <Send size={15} />
          </button>
        </form>
      </div>

      <Modal
        open={invite}
        onClose={() => setInvite(false)}
        title="Invite team member"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setInvite(false)}><X size={14} /> Cancel</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email.', 'err'); return; }
                if (live) {
                  api(`/api/projects/${pid}/members/email`, { method: 'POST', body: { email } })
                    .then(() => { toast(`Invitation sent to ${email}`, 'ok'); setInvite(false); setEmail(''); })
                    .catch((er) => toast(er.message || 'Could not invite that user.', 'err'));
                  return;
                }
                setInvite(false);
                setEmail('');
                toast(`Invitation sent to ${email}`);
              }}
            >
              <UserPlus size={14} /> Send Invite
            </button>
          </>
        }
      >
        <Field label="Email" hint="They’ll receive an invitation email with a join link.">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@university.edu" autoFocus />
        </Field>
      </Modal>
    </div>
  );
}
