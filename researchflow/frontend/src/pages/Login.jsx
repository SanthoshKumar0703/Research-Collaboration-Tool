import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Eye, EyeOff, FlaskConical, FileText, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useSession } from '../lib/session';
import { useToast } from '../lib/toast';
import { DEMO_USERS } from '../lib/session';
import { api, API, hasApi, setToken } from '../lib/api';

function LeftPanel({ headline, sub, items }) {
  return (
    <div className="relative hidden overflow-hidden bg-[#0B1220] text-[#F5F7FF] lg:flex lg:w-1/2">
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(243,237,226,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(243,237,226,0.22) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />
      {/* orbit */}
      <div className="absolute -top-32 -right-32 h-[460px] w-[460px] animate-spin-slow opacity-50">
        <svg viewBox="0 0 460 460" fill="none">
          <circle cx="230" cy="230" r="120" stroke="#7C5CFF" strokeOpacity="0.5" strokeDasharray="3 6" />
          <circle cx="230" cy="230" r="180" stroke="#38D9FF" strokeOpacity="0.35" strokeDasharray="2 8" />
          <circle cx="230" cy="230" r="229" stroke="#F5F7FF" strokeOpacity="0.18" strokeDasharray="1 10" />
          <circle cx="350" cy="230" r="5" fill="#7C5CFF" />
          <circle cx="230" cy="50" r="4" fill="#38D9FF" />
          <circle cx="110" cy="230" r="3.5" fill="#F5F7FF" fillOpacity="0.6" />
          <circle cx="340" cy="340" r="4.5" fill="#38D9FF" />
          <circle cx="150" cy="120" r="3" fill="#7C5CFF" />
        </svg>
      </div>
      {/* floating cards */}
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-28 left-10 w-56 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C5CFF]/25 text-[#7C5CFF]"><FileText size={15} /></span>
          <div>
            <div className="text-[12px] font-semibold">Literature_Review_v3.pdf</div>
            <div className="text-[10px] text-[#94A3C7]">v3 · under review</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[78%] rounded-full bg-[#38D9FF]" />
        </div>
      </motion.div>
      <motion.div
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className="absolute right-12 bottom-44 w-52 rounded-xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4ADE95]/20 text-[#4ADE95]"><FlaskConical size={15} /></span>
          <div>
            <div className="text-[12px] font-semibold">EfficientNet-B4 · fold 1</div>
            <div className="font-mono text-[10px] text-[#4ADE95]">acc 0.891 · auc 0.923</div>
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <Logo light size={34} />
        <div>
          <h2 className="max-w-md font-display text-4xl leading-[1.12] font-semibold xl:text-[44px]">{headline}</h2>
          <p className="mt-5 max-w-md text-[14.5px] leading-relaxed text-[#94A3C7]">{sub}</p>
          <ul className="mt-9 space-y-3.5">
            {items.map(([Icon, label]) => (
              <li key={label} className="flex items-center gap-3 text-[13.5px] text-[#E7ECFB]">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#38D9FF]">
                  <Icon size={14} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[#64718F]">
          <Sparkles size={13} className="text-[#38D9FF]" />
          Where research moves forward.
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { setSession } = useSession();
  const toast = useToast();
  const nav = useNavigate();
  const loc = useLocation();
  const live = hasApi();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Google OAuth round-trip: the backend redirects back with ?google_token=
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('google_token');
    if (!t) return;
    window.history.replaceState({}, '', '/login');
    setToken(t);
    api('/api/auth/me')
      .then((u) => {
        setSession({ name: u.name, email: u.email, role: u.role, avatar: u.avatar || null });
        toast('Signed in with Google', 'ok');
        nav('/app');
      })
      .catch((e) => {
        setToken(null);
        toast(e.message || 'Google sign-in failed.', 'err');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = (e) => {
    e.preventDefault();
    setErr(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Enter a valid email address.');
    if (password.length < 8) return setErr('Password must be at least 8 characters.');
    if (live) {
      setLoading(true);
      api('/api/auth/login', { method: 'POST', body: { email, password } })
        .then((r) => {
          sessionStorage.setItem('rf_pending_email', email);
          if (r.debug_code) sessionStorage.setItem('rf_debug_code', r.debug_code);
          toast('Verification code sent — it appears below (dev mode) or in your email.', 'info');
          nav('/otp');
        })
        .catch((er) => setErr(er.message || 'Sign in failed.'))
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Demo mode: fixed code on the next screen (no backend).
      sessionStorage.setItem('rf_pending_email', email);
      sessionStorage.removeItem('rf_debug_code');
      toast('Verification code sent (demo OTP flow)', 'info');
      nav('/otp');
    }, 900);
  };

  const google = () => {
    if (!live) return toast('Google OAuth activates once the backend is connected.', 'info');
    api('/api/health')
      .then((h) => {
        if (!h.google_configured) {
          toast('Google sign-in is not configured on this deployment (set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET on the API).', 'info');
          return;
        }
        window.location.href = `${API}/api/auth/google`;
      })
      .catch((er) => toast(er.message || 'Google sign-in unavailable.', 'err'));
  };

  const demo = (role) => {
    setSession(DEMO_USERS[role]);
    nav('/app');
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <LeftPanel
        headline="Where research moves forward."
        sub="A focused workspace for researchers, students and supervisors to collaborate, organize knowledge, track experiments and turn research into meaningful outcomes."
        items={[
          [Check, 'Collaborative research workspace'],
          [FileText, 'Research documents with full version history'],
          [FlaskConical, 'Experiments & findings, fully traceable'],
          [Sparkles, 'Progress analytics & local research AI'],
        ]}
      />
      <div className="relative flex w-full flex-col lg:w-1/2">
        <div className="absolute top-5 right-5 z-10">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[380px]"
          >
            <div className="mb-8 lg:hidden">
              <Logo />
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Welcome back</h1>
            <p className="mt-2 text-sm text-faint">Sign in to your research workspace.</p>

            <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="li-email">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
                  <input
                    id="li-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="label mb-0" htmlFor="li-pass">Password</label>
                  <Link to="/forgot-password" className="text-xs font-medium text-wine hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
                  <input
                    id="li-pass"
                    type={show ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="input pr-11 pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
                    aria-label={show ? 'Hide password' : 'Show password'}
                  >
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {err && <p className="rounded-lg bg-rust/10 px-3 py-2 text-[13px] text-rust">{err}</p>}

              <button type="submit" className="btn-primary w-full py-3" disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] tracking-wider text-faint uppercase">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>

            <button
              onClick={google}
              className="btn-outline w-full py-3"
            >
              <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-center text-[13px] text-faint">
              New to ResearchFlow?{' '}
              <Link to="/register" className="font-medium text-wine hover:underline">Create Account</Link>
            </p>

            {live ? (
              <div className="mt-8 rounded-xl border border-dashed border-line-2 bg-paper-soft/50 p-4 text-[12px] leading-relaxed text-faint">
                <span className="font-semibold text-copper">Connected to the ResearchFlow API.</span> Sign in with your
                account (the seeded researcher demo account is{' '}
                <span className="font-mono text-ink-2">santhosh.kumar@researchflow.app</span>).
              </div>
            ) : (
              <div className="mt-8 rounded-xl border border-dashed border-line-2 bg-paper-soft/50 p-4">
                <div className="text-[10.5px] font-semibold tracking-[0.14em] text-faint uppercase">Preview as demo role</div>
                <div className="mt-2.5 grid grid-cols-3 gap-2">
                  {[['researcher', 'Researcher'], ['supervisor', 'Supervisor'], ['admin', 'Admin']].map(([r, l]) => (
                    <button
                      key={r}
                      onClick={() => demo(r)}
                      className="rounded-lg border border-line bg-card px-2 py-2 text-[11.5px] font-medium text-ink-2 transition hover:border-wine/40 hover:text-wine"
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
