import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, CalendarPlus, Check, CheckCircle2, Clock, Copy, Video } from 'lucide-react';
import { useWork } from '../lib/work';
import { hasApi } from '../lib/api';
import { useToast } from '../lib/toast';
import { useSession } from '../lib/session';
import { Avatar, Badge, Field, Modal, Progress, Reveal, StatusPill } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { cn, fmtDate, fmtDateShort } from '../lib/utils';

export default function Meetings({ global = false }) {
  const { id } = useParams();
  const { work, user, actions, mode } = useWork();
  const { session } = useSession();
  const sessionName = session?.name || 'You';
  const live = mode === 'api';
  const [projectId, setProjectId] = useState(global ? 'p1' : id);
  const proj = work.projects.find((x) => x.id === projectId);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [notesFor, setNotesFor] = useState(null);
  const [notes, setNotes] = useState('');
  const [f, setF] = useState({ title: '', date: '', time: '10:00', participants: null, agenda: '' });

  // Participant options: real project members in API mode, fixed demo roster otherwise.
  const memberOpts = live
    ? (proj ? ['me', ...proj.members.filter((m) => m !== 'me')] : ['me'])
    : ['u1', 'u2', 'u3', 'u5', 'u6'];
  const selParticipants = f.participants || (live ? ['me'] : ['u1', 'u3']);
  const memberName = (pid) => (pid === 'me' ? sessionName : user(pid)?.name || 'Member');

  const meetings = work.meetings.filter((m) => m.projectId === projectId);
  const upcoming = meetings.filter((m) => m.status === 'scheduled').sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const past = meetings.filter((m) => m.status === 'completed').sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const copyLink = (m) => {
    navigator.clipboard?.writeText(m.link).then(
      () => toast('Meeting link copied'),
      () => toast(m.link, 'info')
    );
  };

  const create = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.date) return toast('Title and date are required.', 'err');
    actions.scheduleMeeting({
      projectId,
      title: f.title,
      date: new Date(`${f.date}T${f.time || '10:00'}`).toISOString(),
      time: f.time || '10:00',
      participants: selParticipants,
      agenda: f.agenda.split('\n').map((s) => s.trim()).filter(Boolean),
    });
    setOpen(false);
    setF({ ...f, title: '', date: '', agenda: '' });
    toast('Meeting scheduled — participants notified');
  };

  const saveNotes = (m) => {
    actions.saveMeetingNotes(m.id, notes, m.actions);
    setNotesFor(null);
    setNotes('');
    toast('Notes saved to the meeting record');
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-faint">
          {upcoming.length} upcoming · {past.length} completed
        </p>
        <div className="flex items-center gap-2">
          {global && (
            <select className="input w-auto py-2 text-[12.5px]" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              {work.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <CalendarPlus size={15} /> Schedule Meeting
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Upcoming */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-faint uppercase">
            <Clock size={13} /> Upcoming
          </h3>
          {upcoming.length === 0 && (
            <div className="card p-8 text-center text-[13px] text-faint">No upcoming meetings.</div>
          )}
          {upcoming.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.07}>
              <div className="card p-5 transition-shadow hover:shadow-lift">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-wine text-[rgb(var(--c-on-accent))]">
                    <span className="font-display text-[20px] leading-none font-bold">{new Date(m.date).getDate()}</span>
                    <span className="mt-0.5 text-[9px] tracking-wider uppercase">{new Date(m.date).toLocaleDateString('en-GB', { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-semibold text-ink">{m.title}</h4>
                      <StatusPill status="Scheduled" />
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-faint">
                      <Calendar size={12} /> {fmtDate(m.date)} · {m.time}
                    </div>
                    {m.agenda.length > 0 && (
                      <ul className="mt-2.5 space-y-1">
                        {m.agenda.map((a) => (
                          <li key={a} className="flex items-start gap-2 text-[12.5px] text-ink-2">
                            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-copper" /> {a}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <div className="flex -space-x-2">
                        {m.participants.map((p) => (
                          <Avatar key={p} name={user(p)?.name || 'You'} size={24} ring />
                        ))}
                      </div>
                      <span className="text-[11px] text-faint">{m.participants.length} participants</span>
                      <div className="ml-auto flex gap-1.5">
                        <button onClick={() => copyLink(m)} className="btn-ghost px-2.5 py-1.5 text-[12px]">
                          <Copy size={12} /> Link
                        </button>
                        <button
                          onClick={() => toast('Join links go live with the meeting-integration backend phase.', 'info')}
                          className="btn-soft px-2.5 py-1.5 text-[12px]"
                        >
                          <Video size={12} /> Join
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Completed */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-faint uppercase">
            <CheckCircle2 size={13} /> Completed
          </h3>
          {past.map((m, i) => (
            <Reveal key={m.id} delay={i * 0.07}>
              <div className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[15px] font-semibold text-ink">{m.title}</h4>
                      <StatusPill status="Completed" />
                    </div>
                    <div className="mt-1 text-[12px] text-faint">{fmtDate(m.date)} · {m.time}</div>
                  </div>
                  <button
                    onClick={() => { setNotesFor(m); setNotes(m.notes || ''); }}
                    className={cn('btn-ghost px-2.5 py-1.5 text-[12px]', !m.notes && 'text-wine')}
                  >
                    {m.notes ? 'Notes' : 'Add notes'}
                  </button>
                </div>
                {m.notes && (
                  <p className="mt-3 rounded-lg border border-line bg-paper-soft/50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-2">
                    {m.notes}
                  </p>
                )}
                {m.actions?.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-line pt-3">
                    <div className="text-[10.5px] font-semibold tracking-wider text-faint uppercase">Action items</div>
                    {m.actions.map((a, j) => (
                      <div key={j} className="flex items-center gap-2 text-[12.5px]">
                        <span className={cn('flex h-4 w-4 items-center justify-center rounded border', a.done ? 'border-moss bg-moss text-white' : 'border-line-2')}>
                          {a.done && <Check size={10} />}
                        </span>
                        <span className={a.done ? 'text-faint line-through' : 'text-ink-2'}>{a.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Schedule modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Schedule meeting"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={create}><CalendarPlus size={14} /> Schedule</button>
          </>
        }
      >
        <form onSubmit={create} className="space-y-4" noValidate>
          <Field label="Meeting Title" required>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Weekly Sync" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date" required>
              <input type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            </Field>
            <Field label="Time">
              <input type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
            </Field>
          </div>
          <Field label="Participants">
            <div className="flex flex-wrap gap-2">
              {memberOpts.map((pid) => {
                const on = selParticipants.includes(pid);
                const nm = memberName(pid);
                return (
                  <button
                    type="button"
                    key={pid}
                    onClick={() => setF({ ...f, participants: on ? selParticipants.filter((x) => x !== pid) : [...selParticipants, pid] })}
                    className={cn(
                      'flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                      on ? 'border-wine/40 bg-wine-soft text-wine' : 'border-line text-ink-2 hover:border-line-2'
                    )}
                  >
                    <Avatar name={nm} size={18} /> {nm}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Agenda" hint="One item per line">
            <textarea className="input min-h-[80px]" value={f.agenda} onChange={(e) => setF({ ...f, agenda: e.target.value })} placeholder={'Progress review\nNext steps'} />
          </Field>
          <p className="text-[11.5px] text-faint">Participants are notified in-app and by email (SMTP), with a 30-minute reminder.</p>
        </form>
      </Modal>

      {/* Notes modal */}
      <Modal
        open={!!notesFor}
        onClose={() => setNotesFor(null)}
        title={`Meeting notes · ${notesFor?.title || ''}`}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setNotesFor(null)}>Cancel</button>
            <button className="btn-primary" onClick={() => saveNotes(notesFor)}><Check size={14} /> Save Notes</button>
          </>
        }
      >
        <Field label="Notes" hint="Decisions, discussion points and follow-ups.">
          <textarea className="input min-h-[140px]" value={notes} onChange={(e) => setNotes(e.target.value)} autoFocus />
        </Field>
      </Modal>
    </div>
  );
}
