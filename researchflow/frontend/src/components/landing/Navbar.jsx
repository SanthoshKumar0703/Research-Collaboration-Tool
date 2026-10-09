import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import { cn } from '../../lib/utils';

const LINKS = [
  { label: 'Why', href: '/#why' },
  { label: 'Platform', href: '/#platform' },
  { label: 'Research AI', href: '/#ai' },
  { label: 'Roles', href: '/#roles' },
  { label: 'Security', href: '/#trust' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    h();
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-line bg-paper/85 backdrop-blur-md'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-6 px-5 lg:px-8">
        <Link to="/" aria-label="ResearchFlow home">
          <Logo />
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-2 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle className="hidden sm:flex" />
          <Link to="/login" className="btn-ghost hidden sm:inline-flex">
            Login
          </Link>
          <Link to="/register" className="btn-primary hidden sm:inline-flex">
            Get Started
          </Link>
          <button
            className="rounded-lg p-2 text-ink-2 hover:bg-ink/5 lg:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-b border-line bg-paper/95 backdrop-blur-md lg:hidden"
          >
            <div className="space-y-1 px-5 py-4">
              {LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-2 hover:bg-ink/5"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex gap-2 pt-3">
                <Link to="/login" className="btn-outline flex-1" onClick={() => setOpen(false)}>Login</Link>
                <Link to="/register" className="btn-primary flex-1" onClick={() => setOpen(false)}>Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
