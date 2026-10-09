import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter } from 'lucide-react';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import { useToast } from '../../lib/toast';

export default function Footer() {
  const toast = useToast();
  const soon = (label) => (e) => {
    e.preventDefault();
    toast(`${label} ships with the full-stack release.`, 'info');
  };
  return (
    <footer className="border-t border-line bg-paper-soft/60">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo />
            <p className="mt-4 max-w-sm text-[13.5px] leading-relaxed text-faint">
              ResearchFlow is the unified workspace for researchers, students, supervisors and
              research teams — plan research, collaborate, track experiments and turn ideas
              into meaningful findings.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                [Github, 'GitHub', () => soon('Our GitHub')],
                [Twitter, 'X', () => soon('Our X profile')],
                [Linkedin, 'LinkedIn', () => soon('Our LinkedIn')],
              ].map(([Icon, label, fn]) => (
                <a
                  key={label}
                  href="#"
                  onClick={(e) => fn(e)}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-faint transition hover:border-line-2 hover:text-ink"
                >
                  <Icon size={15} />
                </a>
              ))}
              <ThemeToggle className="ml-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.16em] text-faint uppercase">Product</h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                <li><a href="/#platform" className="text-ink-2 transition hover:text-wine">Platform</a></li>
                <li><a href="/#why" className="text-ink-2 transition hover:text-wine">Why ResearchFlow</a></li>
                <li><Link to="/login" className="text-ink-2 transition hover:text-wine">Workspace</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.16em] text-faint uppercase">Resources</h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                <li><a href="#" onClick={soon('Documentation')} className="text-ink-2 transition hover:text-wine">Documentation</a></li>
                <li><a href="#" onClick={soon('Help center')} className="text-ink-2 transition hover:text-wine">Help</a></li>
                <li><a href="mailto:hello@researchflow.app" className="text-ink-2 transition hover:text-wine">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[11px] font-semibold tracking-[0.16em] text-faint uppercase">Legal</h3>
              <ul className="mt-4 space-y-2.5 text-[13.5px]">
                <li><Link to="/privacy-policy" className="text-ink-2 transition hover:text-wine">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-ink-2 transition hover:text-wine">Terms &amp; Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-[12px] text-faint">© 2026 ResearchFlow. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-moss" />
            <span className="text-[12px] text-faint">All systems operational</span>
            <span className="chip ml-2 border-line text-[10.5px] text-faint">v0.1 · frontend preview</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
