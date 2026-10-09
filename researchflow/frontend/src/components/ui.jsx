import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn, initials, useCountUp } from '../lib/utils';

/* ── Reveal on scroll ─────────────────────────────────────────── */
export function Reveal({ children, className, delay = 0, y = 24 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.6, 0.35, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────── */
const HUES = [348, 24, 44, 152, 204, 268];
export function Avatar({ name, size = 32, className, ring = false, online = false, src = null }) {
  const hue = HUES[(name || '?').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];
  return (
    <span className={cn('relative inline-flex shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        <span className={cn('block h-full w-full overflow-hidden rounded-full select-none', ring && 'ring-2 ring-card')}>
          <img src={src} alt={name || 'Profile photo'} className="h-full w-full object-cover" />
        </span>
      ) : (
        <span
          className={cn('flex h-full w-full items-center justify-center rounded-full font-medium select-none', ring && 'ring-2 ring-card')}
          style={{
            background: `hsl(${hue} 42% 46%)`,
            color: '#F8F3E9',
            fontSize: Math.max(10, size * 0.36),
            letterSpacing: '0.02em',
          }}
        >
          {initials(name)}
        </span>
      )}
      {online && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-card bg-moss"
          style={{ width: size * 0.34, height: size * 0.34 }}
        />
      )}
    </span>
  );
}

export function AvatarStack({ names, size = 26, max = 4 }) {
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="flex items-center">
      {shown.map((n, i) => (
        <span key={i} style={{ marginLeft: i ? -8 : 0 }} className="z-[1]">
          <Avatar name={n} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="flex items-center justify-center rounded-full border border-line bg-paper-soft font-medium text-faint"
          style={{ width: size, height: size, marginLeft: -8, fontSize: size * 0.34 }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

/* ── Badge / status pill ──────────────────────────────────────── */
const TONE = {
  neutral: 'bg-ink/6 text-ink-2 border-ink/10',
  wine: 'bg-wine-soft text-wine border-wine/20',
  copper: 'bg-copper-soft text-copper border-copper/25',
  gold: 'bg-gold-soft text-copper border-gold/30',
  moss: 'bg-moss/10 text-moss border-moss/25',
  amber: 'bg-amber/10 text-amber border-amber/25',
  rust: 'bg-rust/10 text-rust border-rust/25',
};

export function Badge({ tone = 'neutral', children, className, dot = false }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap', TONE[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS_TONE = {
  'not started': 'neutral', 'not-started': 'neutral', planned: 'neutral', pending: 'amber',
  'pending review': 'amber', 'pending-review': 'amber', 'in progress': 'amber', 'in-progress': 'amber',
  running: 'copper', 'under review': 'copper', review: 'copper', approved: 'moss', completed: 'moss',
  active: 'moss', resolved: 'moss', scheduled: 'wine', 'changes requested': 'rust', 'changes-requested': 'rust',
  failed: 'rust', delayed: 'rust', overdue: 'rust', planning: 'gold',
};
export function StatusPill({ status, className }) {
  const key = (status || '').toLowerCase().replace(/_/g, ' ');
  return <Badge tone={STATUS_TONE[key] || 'neutral'} dot className={className}>{status}</Badge>;
}

/* ── Progress ─────────────────────────────────────────────────── */
export function Progress({ value, tone = 'wine', className, height = 6 }) {
  const colors = { wine: 'bg-wine', gold: 'bg-gold', moss: 'bg-moss', copper: 'bg-copper' };
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-ink/8', className)} style={{ height }}>
      <motion.div
        className={cn('h-full rounded-full', colors[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  );
}

export function Ring({ value, size = 56, stroke = 5, tone = 'wine', label = null, sub = null }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const colors = { wine: 'var(--c-wine)', gold: 'var(--c-gold)', moss: 'var(--c-moss)', copper: 'var(--c-copper)' };
  const [off, setOff] = React.useState(c);
  useEffect(() => {
    const t = setTimeout(() => setOff(c - (c * value) / 100), 80);
    return () => clearTimeout(t);
  }, [value, c]);
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--c-ink) / 0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={colors[tone]} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22, 0.61, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold text-ink" style={{ fontSize: size * 0.26 }}>{label ?? `${value}%`}</span>
        {sub && <span className="text-[9px] text-faint">{sub}</span>}
      </span>
    </span>
  );
}

/* ── Stat card with animated counter ──────────────────────────── */
export function Stat({ icon: Icon, label, value, suffix = '', delta, deltaTone = 'moss', decimals = 0, sub }) {
  const v = useCountUp(value);
  return (
    <div className="card p-4 lg:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium tracking-wide text-faint uppercase">{label}</div>
          <div className="mt-2 font-display text-[26px] leading-none font-semibold text-ink lg:text-3xl">
            {decimals ? v.toFixed(decimals) : Math.round(v)}
            <span className="text-lg text-faint">{suffix}</span>
          </div>
          {(sub || delta) && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {delta && <span className={cn('font-medium', deltaTone === 'moss' ? 'text-moss' : deltaTone === 'rust' ? 'text-rust' : 'text-amber')}>{delta}</span>}
              {sub && <span className="text-faint">{sub}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wine-soft text-wine">
            <Icon size={17} />
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, title, desc, action, className }) {
  return (
    <div className={cn('card flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-line-2 text-faint">
        {Icon && <Icon size={22} />}
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
      {desc && <p className="mt-1.5 max-w-sm text-sm text-faint">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────── */
export function Skeleton({ className }) {
  return <div className={cn('animate-pulse rounded-lg bg-ink/8', className)} />;
}

/* ── Modal ────────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, wide = false, footer = null }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === 'Escape' && onClose && onClose();
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
      <motion.div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] dark:bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className={cn('relative w-full rounded-2xl border border-line bg-card shadow-lift', wide ? 'max-w-2xl' : 'max-w-md')}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink" aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </motion.div>
    </div>,
    document.body
  );
}

/* ── Tabs ─────────────────────────────────────────────────────── */
export function Tabs({ items, active, onChange, className }) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cn(
            'relative whitespace-nowrap px-3.5 py-2.5 text-[13px] transition-colors',
            active === it.id ? 'font-medium text-ink' : 'text-faint hover:text-ink-2'
          )}
        >
          {it.label}
          {active === it.id && (
            <motion.span layoutId="tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-wine" />
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Switch ───────────────────────────────────────────────────── */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5.5 w-10 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-wine' : 'bg-ink/15'
      )}
      style={{ height: 22 }}
    >
      <motion.span
        className="absolute top-[3px] h-4 w-4 rounded-full bg-card shadow"
        animate={{ left: checked ? 21 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      />
    </button>
  );
}

/* ── Field wrapper ────────────────────────────────────────────── */
export function Field({ label, error, hint, children, required = false }) {
  return (
    <div>
      {label && (
        <label className="label">
          {label} {required && <span className="text-wine">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-rust">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Page header ──────────────────────────────────────────────── */
export function PageHeader({ title, sub, actions, children }) {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink lg:text-[28px]">{title}</h1>
          {sub && <p className="mt-1 text-sm text-faint">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

/* ── Section heading (landing) ────────────────────────────────── */
export function SectionHead({ eyebrow, title, sub, center = false, className }) {
  return (
    <Reveal className={cn(center && 'mx-auto text-center', 'max-w-2xl', className)}>
      <div className={cn('flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-copper uppercase', center && 'justify-center')}>
        <span className="h-px w-6 bg-copper/50" />
        {eyebrow}
        {center && <span className="h-px w-6 bg-copper/50" />}
      </div>
      <h2 className="mt-3 font-display text-3xl leading-[1.12] font-semibold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-[15px] leading-relaxed text-ink-2">{sub}</p>}
    </Reveal>
  );
}
