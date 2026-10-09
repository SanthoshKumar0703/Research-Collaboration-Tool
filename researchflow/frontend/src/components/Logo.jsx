import React from 'react';
import { cn } from '../lib/utils';

export function LogoMark({ size = 30, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={cn('shrink-0', className)} aria-hidden>
      <rect width="64" height="64" rx="14" fill="rgb(var(--c-wine))" />
      <path
        d="M20 46V18h13a9 9 0 0 1 0 18H28"
        fill="none"
        stroke="rgb(var(--c-on-accent))"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M32 36l10 10" stroke="rgb(var(--c-gold))" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ size = 30, withWord = true, className, light = false }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {withWord && (
        <span
          className={cn('font-display text-[19px] font-semibold tracking-tight', light ? 'text-[#F5F7FF]' : 'text-ink')}
        >
          Research<span className={light ? 'text-[#38D9FF]' : 'text-wine'}>Flow</span>
        </span>
      )}
    </span>
  );
}
