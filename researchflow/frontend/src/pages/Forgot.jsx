import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Mail } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useToast } from '../lib/toast';
import { cn } from '../lib/utils';
import { api, hasApi } from '../lib/api';

export default function Forgot() {
  const toast = useToast();
  const nav = useNavigate();
  const token = new URLSearchParams(window.location.search).get('t') || '';
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(token ? 'reset' : 'ask'); // ask | sent | reset
  const [np, setNp] = useState('');
  const [cp, setCp] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const live = hasApi();

  const ask = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr('Enter a valid email address.');
    setLoading(true);
    if (live) {
      api('/api/auth/forgot-password', { method: 'POST', body: { email } })
        .then(() => setStep('sent'))
        .catch((er) => setErr(er.message || 'Could not send the reset link.'))
        .finally(() => setLoading(false));
      return;
    }
    setTimeout(() => { setLoading(false); setStep('sent'); }, 800);
  };

  const reset = (e) => {
    e.preventDefault();
    if (np.length < 8) return setErr('Password must be at least 8 characters.');
    if (np !== cp) return setErr('Passwords do not match.');
    setLoading(true);
    if (live) {
      api('/api/auth/reset-password', { method: 'POST', body: { token, password: np } })
        .then(() => { toast('Password updated — sign in with your new password'); nav('/login'); })
        .catch((er) => setErr(er.message || 'Could not update your password.'))
        .finally(() => setLoading(false));
      return;
    }
    setTimeout(() => {
      setLoading(false);
      toast('Password updated — sign in with your new password');
      nav('/login');
    }, 800);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5">
      <div className="editorial-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card relative w-full max-w-[420px] p-8 shadow-lift">
        <Logo />
        <div className="mt-8">
          {step !== 'sent' ? (
            <>
              <h1 className="font-display text-[22px] font-semibold text-ink">Forgot password</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                {step === 'ask'
                  ? 'Enter your account email and we’ll send a secure, expiring reset link.'
                  : 'Choose a new password for your account.'}
              </p>
              {step === 'ask' ? (
                <form onSubmit={ask} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label className="label" htmlFor="fg-email">Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
                      <input id="fg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu" className={cn('input pl-10', err && 'border-rust/60')} />
                    </div>
                    {err && <p className="mt-1.5 text-xs text-rust">{err}</p>}
                  </div>
                  <button className="btn-primary w-full py-3" disabled={loading}>
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <form onSubmit={reset} className="mt-6 space-y-4" noValidate>
                  <div>
                    <label className="label">New password</label>
                    <input type="password" value={np} onChange={(e) => setNp(e.target.value)} placeholder="Minimum 8 characters" className={cn('input', err && 'border-rust/60')} />
                  </div>
                  <div>
                    <label className="label">Confirm new password</label>
                    <input type="password" value={cp} onChange={(e) => setCp(e.target.value)} placeholder="Repeat it" className={cn('input', err && 'border-rust/60')} />
                  </div>
                  {err && <p className="text-xs text-rust">{err}</p>}
                  <button className="btn-primary w-full py-3" disabled={loading}>
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : 'Update Password'}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="text-center">
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-moss/15 text-moss"
              >
                <Check size={28} />
              </motion.span>
              <h1 className="mt-5 font-display text-[22px] font-semibold text-ink">Check your inbox</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-faint">
                If an account exists for <span className="font-medium text-ink-2">{email}</span>, a reset
                link is on its way. The link expires in 30 minutes.
              </p>
              <div className="mt-6 flex gap-2">
                <button onClick={() => setStep('reset')} className="btn-soft flex-1">Open reset form</button>
                <Link to="/login" className="btn-outline flex-1">Back to Login</Link>
              </div>
            </div>
          )}
        </div>
        <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-faint transition hover:text-ink">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
