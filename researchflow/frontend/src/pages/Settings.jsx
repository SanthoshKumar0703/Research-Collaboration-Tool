import React, { useState } from 'react';
import { BellRing, KeyRound, Mail, Monitor, Moon, ShieldCheck, Sun, Trash2 } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { useToast } from '../lib/toast';
import { Field, PageHeader, Switch, Tabs } from '../components/ui';
import { requestBrowserPermission, browserNotify, notificationStatus } from '../lib/notify';
import { cn } from '../lib/utils';

const TABS = [
  { id: 'account', label: 'Account' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'email', label: 'Email' },
  { id: 'browser', label: 'Browser Notifications' },
];

function Row({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-4 last:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        {desc && <div className="mt-0.5 text-[12px] leading-relaxed text-faint">{desc}</div>}
      </div>
      {children}
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const [tab, setTab] = useState('account');
  const [prefs, setPrefs] = useState({
    task: true, review: true, comment: true, meeting: true, deadline: true, experiment: true, product: false,
  });
  const [emailPrefs, setEmailPrefs] = useState({
    otp: true, reset: true, meeting: true, digest: false,
  });
  const [perm, setPerm] = useState(notificationStatus());
  const [sessions, setSessions] = useState([
    { id: 's1', device: 'This browser · Chrome on macOS', where: 'Coimbatore, IN', current: true },
    { id: 's2', device: 'Firefox on Windows', where: 'Coimbatore, IN', current: false },
  ]);

  return (
    <div className="mx-auto max-w-[860px]">
      <PageHeader title="Settings" sub="Account, security and notification preferences" />
      <Tabs items={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'account' && (
        <div className="card p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input className="input" defaultValue="Santhosh Kumar" />
            </Field>
            <Field label="Email">
              <input className="input opacity-60" defaultValue="santhosh.kumar@researchflow.app" disabled />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" onClick={() => toast('Account details saved')}>Save</button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-5">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
              <KeyRound size={16} className="text-copper" /> Password
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Current password">
                <input type="password" className="input" placeholder="••••••••" />
              </Field>
              <Field label="New password">
                <input type="password" className="input" placeholder="Minimum 8 characters" />
              </Field>
              <Field label="Confirm new password">
                <input type="password" className="input" placeholder="Repeat it" />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="btn-primary"
                onClick={() => toast('Password change queued — a verification email will be sent (SMTP in the backend phase)', 'info')}
              >
                Update Password
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-2 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
              <ShieldCheck size={16} className="text-copper" /> Two-step verification
            </h3>
            <Row title="Email OTP on sign-in" desc="A 6-digit code is emailed on every password sign-in. Google sign-in is exempt.">
              <Switch checked onChange={(v) => toast(v ? 'Email OTP enabled' : 'Email OTP disabled (not recommended)', 'info')} />
            </Row>
          </div>

          <div className="card p-6">
            <h3 className="mb-2 font-display text-[15.5px] font-semibold text-ink">Active sessions</h3>
            {sessions.map((s) => (
              <Row key={s.id} title={s.device} desc={`${s.where} · signed in recently`}>
                {s.current ? (
                  <span className="chip">Current</span>
                ) : (
                  <button
                    onClick={() => { setSessions((x) => x.filter((y) => y.id !== s.id)); toast('Session revoked'); }}
                    className="btn-ghost px-2.5 py-1.5 text-[12px] text-rust hover:bg-rust/10"
                  >
                    <Trash2 size={13} /> Revoke
                  </button>
                )}
              </Row>
            ))}
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="card p-6">
          <h3 className="mb-2 font-display text-[15.5px] font-semibold text-ink">In-app notifications</h3>
          <Row title="Task assigned or moved" desc="When a task is assigned to you or changes status.">
            <Switch checked={prefs.task} onChange={(v) => setPrefs({ ...prefs, task: v })} />
          </Row>
          <Row title="Document reviews" desc="Approvals, changes requested and new review comments.">
            <Switch checked={prefs.review} onChange={(v) => setPrefs({ ...prefs, review: v })} />
          </Row>
          <Row title="Comments & mentions" desc="Replies in discussions and @mentions in chat.">
            <Switch checked={prefs.comment} onChange={(v) => setPrefs({ ...prefs, comment: v })} />
          </Row>
          <Row title="Meeting reminders" desc="30 minutes before scheduled meetings.">
            <Switch checked={prefs.meeting} onChange={(v) => setPrefs({ ...prefs, meeting: v })} />
          </Row>
          <Row title="Deadline approaching" desc="Milestone and task deadlines within 7 days.">
            <Switch checked={prefs.deadline} onChange={(v) => setPrefs({ ...prefs, deadline: v })} />
          </Row>
          <Row title="Experiment reviews" desc="When experiments enter or leave review.">
            <Switch checked={prefs.experiment} onChange={(v) => setPrefs({ ...prefs, experiment: v })} />
          </Row>
          <Row title="Product updates" desc="Occasional notes about new ResearchFlow features.">
            <Switch checked={prefs.product} onChange={(v) => setPrefs({ ...prefs, product: v })} />
          </Row>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="card p-6">
          <h3 className="mb-4 font-display text-[15.5px] font-semibold text-ink">Theme</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { id: 'light', label: 'Light', icon: Sun, desc: 'Warm ivory, charcoal ink, burgundy accents' },
              { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep espresso, soft ivory text, copper glow' },
              { id: 'system', label: 'System', icon: Monitor, desc: 'Follows your device preference' },
            ].map((o) => {
              const active = o.id === 'system' ? false : theme === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => {
                    if (o.id === 'system') {
                      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                      setTheme(sys);
                      toast('Following system preference (re-applies on load)', 'info');
                    } else setTheme(o.id);
                  }}
                  className={cn(
                    'rounded-xl border p-4 text-left transition-all',
                    active ? 'border-wine/50 bg-wine-soft/50 shadow-soft' : 'border-line hover:border-line-2'
                  )}
                  aria-pressed={active}
                >
                  <o.icon size={17} className={active ? 'text-wine' : 'text-faint'} />
                  <div className="mt-2.5 text-[14px] font-semibold text-ink">{o.label}</div>
                  <div className="mt-1 text-[11.5px] leading-relaxed text-faint">{o.desc}</div>
                  <div className="mt-3 flex gap-1.5">
                    {o.id === 'light' ? (
                      <>
                        <span className="h-5 flex-1 rounded bg-[#FAF7F1] ring-1 ring-black/10" />
                        <span className="h-5 flex-1 rounded bg-[#7A2937]" />
                        <span className="h-5 flex-1 rounded bg-[#BA954A]" />
                      </>
                    ) : o.id === 'dark' ? (
                      <>
                        <span className="h-5 flex-1 rounded bg-[#070B18] ring-1 ring-white/10" />
                        <span className="h-5 flex-1 rounded bg-[#4F7CFF]" />
                        <span className="h-5 flex-1 rounded bg-[#38D9FF]" />
                      </>
                    ) : (
                      <>
                        <span className="h-5 flex-1 rounded bg-gradient-to-r from-[#FAF7F1] to-[#070B18] ring-1 ring-black/10" />
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'email' && (
        <div className="card p-6">
          <h3 className="mb-2 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
            <Mail size={16} className="text-copper" /> Email preferences
          </h3>
          <p className="mb-3 text-[12.5px] text-faint">Delivered through your configured SMTP provider.</p>
          <Row title="Login OTP" desc="One-time verification codes for password sign-in.">
            <Switch checked={emailPrefs.otp} onChange={(v) => setEmailPrefs({ ...emailPrefs, otp: v })} />
          </Row>
          <Row title="Password reset" desc="Reset links when you request a password change.">
            <Switch checked={emailPrefs.reset} onChange={(v) => setEmailPrefs({ ...emailPrefs, reset: v })} />
          </Row>
          <Row title="Meeting reminders" desc="30-minute reminders for meetings you attend.">
            <Switch checked={emailPrefs.meeting} onChange={(v) => setEmailPrefs({ ...emailPrefs, meeting: v })} />
          </Row>
          <Row title="Weekly research digest" desc="A Monday summary of your projects' progress.">
            <Switch checked={emailPrefs.digest} onChange={(v) => setEmailPrefs({ ...emailPrefs, digest: v })} />
          </Row>
        </div>
      )}

      {tab === 'browser' && (
        <div className="card p-6">
          <h3 className="mb-2 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
            <BellRing size={16} className="text-copper" /> Browser / system notifications
          </h3>
          <p className="mb-4 text-[12.5px] leading-relaxed text-faint">
            Real notifications through the browser Notification API, delivered even when ResearchFlow is in another tab.
            Push delivery (when the browser is fully closed) activates with the backend VAPID phase.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span className={cn('chip py-2', perm === 'granted' ? 'border-moss/40 text-moss' : perm === 'denied' ? 'border-rust/40 text-rust' : 'border-line')}>
              Status: {perm === 'granted' ? 'Enabled' : perm === 'denied' ? 'Blocked by browser' : 'Not requested yet'}
            </span>
            {perm !== 'granted' && (
              <button
                className="btn-primary"
                onClick={async () => {
                  const r = await requestBrowserPermission();
                  setPerm(r);
                  if (r === 'granted') {
                    toast('Browser notifications enabled');
                    browserNotify('ResearchFlow', 'You will now receive research alerts here.');
                  }
                }}
              >
                <BellRing size={14} /> Enable notifications
              </button>
            )}
            {perm === 'granted' && (
              <button
                className="btn-outline"
                onClick={() => browserNotify('New Task Assigned', '“Tune CNN hyperparameters on fold 3” was assigned to you.')}
              >
                Send test notification
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
