import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Loader2, Mail, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useSession } from '../lib/session';
import { useToast } from '../lib/toast';
import { DEMO_USERS } from '../lib/session';
import { cn } from '../lib/utils';
import { api, hasApi, setToken } from '../lib/api';

const DEMO_CODE = '246810';

export default function Otp() {
  const { setSession } = useSession();
  const toast = useToast();
  const nav = useNavigate();
  const live = hasApi();
  const email = sessionStorage.getItem('rf_pending_email') || 'your@university.edu';
  const [debugCode, setDebugCode] = useState(() => (live ? sessionStorage.getItem('rf_debug_code') : null));
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expire, setExpire] = useState(300);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef([]);
  const locked = attempts >= 3;

  useEffect(() => {
    if (expire <= 0 || cooldown <= 0) return;
    const t = setInterval(() => {
      setExpire((x) => Math.max(0, x - 1));
      setCooldown((x) => Math.max(0, x - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [expire, cooldown]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...code];
    next[i] = v;
    setCode(next);
    setErr('');
    if (v && i < 5) refs.current[i + 1]?.focus();
  };

  const onKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  };

  const onPaste = (e) => {
    const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = ['0', '0', '0', '0', '0', '0'];
    txt.split('').forEach((c, i) => (next[i] = c));
    setCode(next);
    refs.current[Math.min(5, txt.length - 1)]?.focus();
  };

  const verify = (e) => {
    e.preventDefault();
    if (locked) return;
    const entered = code.join('');
    if (entered.length < 6) return setErr('Enter the full 6-digit code.');
    if (live) {
      setLoading(true);
      api('/api/auth/otp/verify', { method: 'POST', body: { email, code: entered } })
        .then((r) => {
          setToken(r.access_token);
          setSession({ name: r.user.name, email: r.user.email, role: r.user.role, avatar: r.user.avatar || null });
          sessionStorage.removeItem('rf_pending_email');
          sessionStorage.removeItem('rf_debug_code');
          toast('Identity verified — welcome back');
          nav('/app');
        })
        .catch((er) => {
          const a = attempts + 1;
          setAttempts(a);
          setErr(a >= 3 ? 'Too many attempts. Request a new code.' : er.message || 'Incorrect code.');
          setCode(['', '', '', '', '', '']);
          refs.current[0]?.focus();
        })
        .finally(() => setLoading(false));
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (entered === DEMO_CODE) {
        // Demo mode: fixed code, no backend.
        setSession(DEMO_USERS.researcher);
        sessionStorage.removeItem('rf_pending_email');
        toast('Identity verified — welcome back');
        nav('/app');
      } else {
        const a = attempts + 1;
        setAttempts(a);
        setErr(a >= 3 ? 'Too many attempts. Request a new code.' : `Incorrect code — ${3 - a} attempts left.`);
        setCode(['', '', '', '', '', '']);
        refs.current[0]?.focus();
      }
    }, 800);
  };

  const resend = () => {
    if (cooldown > 0) return;
    setCooldown(60);
    setExpire(300);
    setCode(['', '', '', '', '', '']);
    setAttempts(0);
    setErr('');
    if (live) {
      api('/api/auth/otp/resend', { method: 'POST', body: { email, code: '000000' } })
        .then((r) => {
          if (r.debug_code) setDebugCode(r.debug_code);
          toast('A new code has been sent.', 'info');
        })
        .catch((er) => toast(er.message || 'Could not resend the code.', 'err'))
        .finally(() => refs.current[0]?.focus());
    } else {
      toast('A new code has been sent (demo)', 'info');
      refs.current[0]?.focus();
    }
  };

  const mm = String(Math.floor(expire / 60)).padStart(1, '0');
  const ss = String(expire % 60).padStart(2, '0');

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper px-5">
      <div className="editorial-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_60%_at_50%_40%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-wine/8 blur-3xl" />
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="card relative w-full max-w-[420px] p-8 shadow-lift"
      >
        <div className="flex items-center justify-between">
          <Logo />
        </div>
        <div className="mt-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-wine-soft text-wine">
            <Mail size={19} />
          </span>
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink">Verify your identity</h1>
            <p className="text-[13px] text-faint">
              We’ve sent a verification code to <span className="font-medium text-ink-2">{email}</span>
            </p>
          </div>
        </div>

        <form onSubmit={verify} className="mt-7" noValidate>
          <motion.div
            className="flex justify-between gap-2"
            animate={err ? { x: [0, -7, 7, -5, 5, 0] } : {}}
            transition={{ duration: 0.4 }}
            onPaste={onPaste}
          >
            {code.map((c, i) => (
              <input
                key={i}
                ref={(el) => (refs.current[i] = el)}
                inputMode="numeric"
                maxLength={1}
                value={c}
                disabled={locked}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                className="h-14 w-full rounded-xl border border-line bg-card-2/60 text-center font-display text-2xl font-semibold text-ink transition focus:border-wine focus:ring-2 focus:ring-wine/15 focus:outline-none disabled:opacity-40"
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </motion.div>

          {err && <p className="mt-3 text-[13px] text-rust">{err}</p>}

          <div className="mt-4 flex items-center justify-between text-[12px] text-faint">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-moss" />
              expires in <span className="font-mono text-ink-2">{mm}:{ss}</span>
            </span>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className={cn('font-medium transition', cooldown > 0 ? 'cursor-not-allowed text-faint/60' : 'text-wine hover:underline')}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>

          <button type="submit" className="btn-primary mt-6 w-full py-3" disabled={loading || locked}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying…</> : <><Check size={16} /> Verify &amp; Continue</>}
          </button>
        </form>

        {live ? (
          debugCode ? (
            <div className="mt-5 rounded-lg border border-dashed border-gold/40 bg-gold-soft/50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-copper">
              <strong>Dev mode (OTP_DEBUG):</strong> your one-time code is <span className="font-mono font-semibold">{debugCode}</span>.
              With SMTP configured the same code is also emailed.
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-line-2 bg-paper-soft/50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-faint">
              The code was sent to <span className="font-medium text-ink-2">{email}</span> via the configured SMTP relay.
            </div>
          )
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-gold/40 bg-gold-soft/50 px-3.5 py-2.5 text-[11.5px] leading-relaxed text-copper">
            <strong>Demo preview:</strong> use code <span className="font-mono font-semibold">{DEMO_CODE}</span>.
            In the production flow the code is generated server-side and delivered by email (SMTP).
          </div>
        )}

        <Link to="/login" className="mt-6 flex items-center justify-center gap-1.5 text-[13px] text-faint transition hover:text-ink">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
