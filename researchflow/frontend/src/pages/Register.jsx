import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Eye, EyeOff, FlaskConical, GraduationCap, Loader2, Mail, UserRound } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../lib/toast';
import { USERS } from '../lib/mock';
import { cn } from '../lib/utils';
import { api, hasApi } from '../lib/api';

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const S_LABEL = ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'];
const S_COLOR = ['bg-ink/15', 'bg-rust', 'bg-amber', 'bg-copper', 'bg-moss'];

export default function Register() {
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', pass: '', confirm: '', role: 'researcher' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const s = strength(f.pass);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = 'Enter a valid email address.';
    if (!hasApi() && USERS.some((u) => u.email === f.email.toLowerCase())) er.email = 'An account with this email already exists.';
    if (s < 3) er.pass = 'Use 8+ characters with an uppercase letter and a number.';
    if (f.confirm !== f.pass) er.confirm = 'Passwords do not match.';
    setErrors(er);
    if (Object.keys(er).length) return;
    if (hasApi()) {
      setLoading(true);
      api('/api/auth/register', { method: 'POST', body: { name: f.name.trim(), email: f.email.trim(), password: f.pass, role: f.role } })
        .then((r) => {
          sessionStorage.setItem('rf_pending_email', r.email);
          if (r.debug_code) sessionStorage.setItem('rf_debug_code', r.debug_code);
          toast('Account created — verify the code to finish signing in.', 'ok');
          nav('/otp');
        })
        .catch((er) => {
          setErrors({ email: /already exists/i.test(er.message) ? 'An account with this email already exists.' : er.message });
        })
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      toast('Account created', 'ok');
    }, 1000);
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="relative hidden overflow-hidden bg-[#0B1220] text-[#F5F7FF] lg:flex lg:w-1/2">
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(243,237,226,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(243,237,226,0.22) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
        <div className="absolute -bottom-40 -left-40 h-[480px] w-[480px] animate-spin-slow opacity-40">
          <svg viewBox="0 0 460 460" fill="none">
            <circle cx="230" cy="230" r="120" stroke="#7C5CFF" strokeOpacity="0.5" strokeDasharray="3 6" />
            <circle cx="230" cy="230" r="180" stroke="#38D9FF" strokeOpacity="0.35" strokeDasharray="2 8" />
            <circle cx="230" cy="230" r="229" stroke="#F5F7FF" strokeOpacity="0.18" strokeDasharray="1 10" />
            <circle cx="350" cy="230" r="5" fill="#7C5CFF" />
            <circle cx="230" cy="50" r="4" fill="#38D9FF" />
          </svg>
        </div>
        <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
          <Logo light size={34} />
          <div>
            <h2 className="max-w-md font-display text-4xl leading-[1.12] font-semibold xl:text-[44px]">
              Join the research flow.
            </h2>
            <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-[#94A3C7]">
              Create your account and pick the role that fits how you work. Admin accounts are
              provisioned by platform administrators — public registration covers researchers and
              supervisors only.
            </p>
            <ul className="mt-9 space-y-3.5 text-[13.5px] text-[#E7ECFB]">
              {['Role-based workspace, from day one', 'Your documents, experiments and findings in one place', 'Invitations to join supervisor-managed projects'].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#38D9FF]"><Check size={14} /></span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="text-[12px] text-[#64718F]">© 2026 ResearchFlow</div>
        </div>
      </div>

      <div className="relative flex w-full flex-col lg:w-1/2">
        <div className="absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card p-8 text-center"
                >
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moss/15 text-moss"
                  >
                    <Check size={28} />
                  </motion.span>
                  <h1 className="mt-5 font-display text-2xl font-semibold text-ink">Account created</h1>
                  <p className="mt-2 text-sm text-faint">
                    Welcome to ResearchFlow, {f.name.split(' ')[0]}. Sign in to enter your workspace —
                    your password was hashed and stored securely.
                  </p>
                  <button onClick={() => nav('/login')} className="btn-primary mt-6 w-full py-3">
                    Continue to Login
                  </button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                  <div className="mb-8 lg:hidden">
                    <Logo />
                  </div>
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Create account</h1>
                  <p className="mt-2 text-sm text-faint">Start your research workspace in minutes.</p>

                  <form onSubmit={submit} className="mt-7 space-y-4" noValidate>
                    <div>
                      <label className="label" htmlFor="rg-name">Full Name</label>
                      <div className="relative">
                        <UserRound size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
                        <input id="rg-name" value={f.name} onChange={set('name')} placeholder="Ada Lovelace" className={cn('input pl-10', errors.name && 'border-rust/60')} />
                      </div>
                      {errors.name && <p className="mt-1.5 text-xs text-rust">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="rg-email">Email</label>
                      <div className="relative">
                        <Mail size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
                        <input id="rg-email" type="email" value={f.email} onChange={set('email')} placeholder="you@university.edu" className={cn('input pl-10', errors.email && 'border-rust/60')} />
                      </div>
                      {errors.email && <p className="mt-1.5 text-xs text-rust">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="rg-pass">Password</label>
                      <div className="relative">
                        <input
                          id="rg-pass"
                          type={show ? 'text' : 'password'}
                          value={f.pass}
                          onChange={set('pass')}
                          placeholder="Minimum 8 characters"
                          className={cn('input pr-11', errors.pass && 'border-rust/60')}
                        />
                        <button type="button" onClick={() => setShow((x) => !x)} className="absolute top-1/2 right-3 -translate-y-1/2 text-faint hover:text-ink" aria-label="Toggle password visibility">
                          {show ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {f.pass && (
                        <div className="mt-2">
                          <div className="flex gap-1.5">
                            {[0, 1, 2, 3].map((i) => (
                              <span key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < s ? S_COLOR[s] : 'bg-ink/10')} />
                            ))}
                          </div>
                          <div className="mt-1 text-[11px] text-faint">{S_LABEL[s]} — use uppercase, a number & symbol for a strong password</div>
                        </div>
                      )}
                      {errors.pass && <p className="mt-1.5 text-xs text-rust">{errors.pass}</p>}
                    </div>
                    <div>
                      <label className="label" htmlFor="rg-confirm">Confirm Password</label>
                      <input
                        id="rg-confirm"
                        type={show ? 'text' : 'password'}
                        value={f.confirm}
                        onChange={set('confirm')}
                        placeholder="Repeat your password"
                        className={cn('input', errors.confirm && 'border-rust/60')}
                      />
                      {errors.confirm && <p className="mt-1.5 text-xs text-rust">{errors.confirm}</p>}
                    </div>
                    <div>
                      <span className="label">Your role</span>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ['researcher', 'Researcher', GraduationCap, 'Run experiments, tasks and findings'],
                          ['supervisor', 'Supervisor', FlaskConical, 'Guide, review and manage projects'],
                        ].map(([val, l, Icon, d2]) => (
                          <button
                            type="button"
                            key={val}
                            onClick={() => setF((p) => ({ ...p, role: val }))}
                            className={cn(
                              'rounded-xl border p-3.5 text-left transition-all',
                              f.role === val ? 'border-wine/50 bg-wine-soft/60 shadow-soft' : 'border-line bg-card hover:border-line-2'
                            )}
                            aria-pressed={f.role === val}
                          >
                            <Icon size={17} className={f.role === val ? 'text-wine' : 'text-faint'} />
                            <div className="mt-2 text-[13.5px] font-semibold text-ink">{l}</div>
                            <div className="mt-0.5 text-[11px] leading-snug text-faint">{d2}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                      {loading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-[13px] text-faint">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-wine hover:underline">Sign in</Link>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
