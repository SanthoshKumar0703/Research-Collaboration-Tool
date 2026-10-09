import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';

export default function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'relative flex h-8 w-[60px] shrink-0 items-center rounded-full border border-line bg-card-2 px-1 transition-colors',
        className
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        className={cn('flex h-6 w-6 items-center justify-center rounded-full shadow-soft', dark ? 'bg-wine text-[rgb(var(--c-on-accent))]' : 'bg-gold-soft text-copper')}
      >
        {dark ? <Moon size={13} /> : <Sun size={13} />}
      </motion.span>
      <span className={cn('absolute right-2 text-faint', dark && 'opacity-40')}>
        <Sun size={12} />
      </span>
      <span className={cn('absolute left-2 text-faint', !dark && 'opacity-40')}>
        <Moon size={12} />
      </span>
    </button>
  );
}
