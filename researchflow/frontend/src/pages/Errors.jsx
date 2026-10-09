import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LogIn, ShieldOff, ServerCrash, SearchX } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

function Shell({ code, icon: Icon, title, sub, children }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-paper px-5 text-center">
      <div className="editorial-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(55%_55%_at_50%_45%,black,transparent)]" />
      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>
      <Logo className="absolute top-5 left-5" />
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-line bg-card text-wine shadow-soft">
          <Icon size={26} />
        </div>
        <div className="mt-6 font-display text-[80px] leading-none font-semibold tracking-tight text-ink/15 lg:text-[110px]">{code}</div>
        <h1 className="-mt-4 font-display text-2xl font-semibold text-ink lg:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-faint">{sub}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <Shell
      code="404"
      icon={SearchX}
      title="This page slipped off the research trail."
      sub="The page you’re looking for doesn’t exist or was moved. Your projects and data are safe."
    >
      <Link to="/" className="btn-primary">Back to Home</Link>
      <Link to="/app" className="btn-outline">Go to Workspace</Link>
    </Shell>
  );
}

export function Forbidden() {
  return (
    <Shell
      code="403"
      icon={ShieldOff}
      title="You don’t have permission to access this research workspace."
      sub="Your role doesn’t include access to this area. If you believe this is a mistake, ask a supervisor or administrator."
    >
      <Link to="/app" className="btn-primary">Back to Dashboard</Link>
      <Link to="/login" className="btn-outline">Switch Account</Link>
    </Shell>
  );
}

export function ServerError() {
  return (
    <Shell
      code="500"
      icon={ServerCrash}
      title="Something went wrong on our side."
      sub="The service hit an unexpected error. Our logs have been notified — try again in a moment."
    >
      <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
      <Link to="/" className="btn-outline">Back to Home</Link>
    </Shell>
  );
}
