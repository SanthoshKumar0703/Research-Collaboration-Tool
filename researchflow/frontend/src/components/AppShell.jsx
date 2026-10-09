import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, BarChart3, Bell, BookOpen, Brain, Building2, CalendarClock, ClipboardCheck,
  FileText, Files, Flag, FlaskConical, FolderOpen, LayoutDashboard, ListChecks, LogOut,
  Menu, MessagesSquare, Search, Settings2, ShieldCheck, Sparkles, UserPlus, UserRound,
  Users, X,
} from 'lucide-react';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { Avatar } from './ui';
import { useSession } from '../lib/session';
import { useWork } from '../lib/work';
import { clearToken } from '../lib/api';
import { useToast } from '../lib/toast';
import { cn, relTime } from '../lib/utils';

const ICONS = {
  dashboard: LayoutDashboard, projects: FolderOpen, tasks: ListChecks, documents: FileText,
  experiments: FlaskConical, findings: Sparkles, team: Users, discussions: MessagesSquare,
  meetings: CalendarClock, analytics: BarChart3, ai: Brain, notifications: Bell,
  profile: UserRound, settings: Settings2, researchers: UserPlus, reviews: ClipboardCheck,
  reports: BookOpen, users: Users, activity: Activity, admin: ShieldCheck,
};

const NAV = {
  researcher: [
    {
      group: 'Workspace',
      items: [
        { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/app/projects', label: 'My Projects', icon: 'projects' },
        { to: '/app/tasks', label: 'My Tasks', icon: 'tasks' },
      ],
    },
    {
      group: 'Research',
      items: [
        { to: '/app/documents', label: 'Documents', icon: 'documents' },
        { to: '/app/experiments', label: 'Experiments', icon: 'experiments' },
        { to: '/app/findings', label: 'Findings', icon: 'findings' },
        { to: '/app/team', label: 'Team', icon: 'team' },
        { to: '/app/discussions', label: 'Discussions', icon: 'discussions' },
        { to: '/app/meetings', label: 'Meetings', icon: 'meetings' },
      ],
    },
    {
      group: 'Insights',
      items: [
        { to: '/app/analytics', label: 'Analytics', icon: 'analytics' },
        { to: '/app/ai', label: 'Research AI', icon: 'ai' },
      ],
    },
    {
      group: 'Account',
      items: [
        { to: '/app/notifications', label: 'Notifications', icon: 'notifications', badge: true },
        { to: '/app/profile', label: 'Profile', icon: 'profile' },
        { to: '/app/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
  supervisor: [
    {
      group: 'Workspace',
      items: [
        { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/app/projects', label: 'Projects', icon: 'projects' },
        { to: '/app/researchers', label: 'Researchers', icon: 'researchers' },
        { to: '/app/tasks', label: 'Tasks', icon: 'tasks' },
        { to: '/app/reviews', label: 'Reviews', icon: 'reviews' },
      ],
    },
    {
      group: 'Research',
      items: [
        { to: '/app/documents', label: 'Documents', icon: 'documents' },
        { to: '/app/experiments', label: 'Experiments', icon: 'experiments' },
        { to: '/app/meetings', label: 'Meetings', icon: 'meetings' },
      ],
    },
    {
      group: 'Insights',
      items: [
        { to: '/app/analytics', label: 'Analytics', icon: 'analytics' },
        { to: '/app/reports', label: 'Reports', icon: 'reports' },
      ],
    },
    {
      group: 'Account',
      items: [
        { to: '/app/notifications', label: 'Notifications', icon: 'notifications', badge: true },
        { to: '/app/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
  admin: [
    {
      group: 'Platform',
      items: [
        { to: '/app', label: 'Dashboard', icon: 'dashboard', end: true },
        { to: '/app/admin/users', label: 'Users', icon: 'users' },
        { to: '/app/projects', label: 'Projects', icon: 'projects' },
        { to: '/app/documents', label: 'Documents', icon: 'documents' },
      ],
    },
    {
      group: 'Governance',
      items: [
        { to: '/app/admin/activity', label: 'Activity Logs', icon: 'activity' },
        { to: '/app/reports', label: 'Reports', icon: 'reports' },
        { to: '/app/admin/settings', label: 'System Settings', icon: 'admin' },
      ],
    },
    {
      group: 'Account',
      items: [
        { to: '/app/notifications', label: 'Notifications', icon: 'notifications', badge: true },
        { to: '/app/settings', label: 'Settings', icon: 'settings' },
      ],
    },
  ],
};

const ROLE_LABEL = { researcher: 'Researcher', supervisor: 'Supervisor', admin: 'Administrator' };

function Crumb({ pathname }) {
  const { work, project } = useWork();
  if (pathname === '/app') return 'Dashboard';
  if (pathname.startsWith('/app/projects/')) {
    const id = pathname.split('/')[3];
    const p = project(id);
    return p ? p.title : 'Project';
  }
  const map = {
    '/app/projects': 'Projects', '/app/tasks': 'Tasks', '/app/documents': 'Documents',
    '/app/experiments': 'Experiments', '/app/findings': 'Findings', '/app/team': 'Team',
    '/app/discussions': 'Discussions', '/app/meetings': 'Meetings', '/app/analytics': 'Analytics',
    '/app/ai': 'Research AI', '/app/notifications': 'Notifications', '/app/profile': 'Profile',
    '/app/settings': 'Settings', '/app/researchers': 'Researchers', '/app/reviews': 'Review Queue',
    '/app/reports': 'Reports', '/app/admin/users': 'Users', '/app/admin/activity': 'Activity Logs',
    '/app/admin/settings': 'System Settings',
  };
  return map[pathname] || 'ResearchFlow';
}

function NotificationIcon({ type }) {
  const map = {
    task: [ListChecks, 'bg-wine-soft text-wine'],
    doc: [FileText, 'bg-copper-soft text-copper'],
    review: [ClipboardCheck, 'bg-copper-soft text-copper'],
    comment: [MessagesSquare, 'bg-gold-soft text-copper'],
    meeting: [CalendarClock, 'bg-wine-soft text-wine'],
    deadline: [Flag, 'bg-amber/10 text-amber'],
    experiment: [FlaskConical, 'bg-moss/10 text-moss'],
    discussion: [MessagesSquare, 'bg-gold-soft text-copper'],
    finding: [Sparkles, 'bg-moss/10 text-moss'],
    system: [Bell, 'bg-ink/6 text-ink-2'],
  };
  const [Icon, cls] = map[type] || map.system;
  return (
    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', cls)}>
      <Icon size={15} />
    </span>
  );
}

export default function AppShell() {
  const { session, setSession, switchRole } = useSession();
  const { work, actions, mode } = useWork();
  const toast = useToast();
  const loc = useLocation();
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const unread = work.notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setDrawer(false); setBellOpen(false); setMenuOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const groups = NAV[session?.role] || NAV.researcher;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Link to="/app" aria-label="ResearchFlow home">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="px-3 pb-1.5 text-[10px] font-semibold tracking-[0.16em] text-faint uppercase">
              {g.group}
            </div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const Icon = ICONS[it.icon];
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.end}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors',
                        isActive
                          ? 'bg-wine-soft font-medium text-wine'
                          : 'text-ink-2 hover:bg-ink/5 hover:text-ink'
                      )
                    }
                  >
                    <Icon size={16.5} className="shrink-0" />
                    <span className="truncate">{it.label}</span>
                    {it.badge && unread > 0 && (
                      <span className="ml-auto rounded-full bg-wine px-1.5 py-px text-[10px] font-semibold text-[rgb(var(--c-on-accent))]">
                        {unread}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="space-y-2 border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
          <Avatar name={session.name} size={34} src={session.avatar} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-ink">{session.name}</div>
            <div className="truncate text-[11px] text-faint">{ROLE_LABEL[session.role]}</div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Desktop sidebar */}
      <aside className="hidden w-[264px] shrink-0 border-r border-line bg-card-2/50 lg:block">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-card shadow-lift lg:hidden"
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <button
                onClick={() => setDrawer(false)}
                className="absolute top-4 right-3 z-10 rounded-lg p-1.5 text-faint hover:bg-ink/5"
                aria-label="Close menu"
              >
                <X size={17} />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur lg:px-7">
          <button
            className="rounded-lg p-2 text-ink-2 hover:bg-ink/5 lg:hidden"
            onClick={() => setDrawer(true)}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold tracking-[0.14em] text-faint uppercase">ResearchFlow</div>
            <h2 className="truncate font-display text-[15px] leading-tight font-semibold text-ink">
              <Crumb pathname={loc.pathname} />
            </h2>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden w-56 items-center gap-2 rounded-lg border border-line bg-card px-3 py-2 text-[13px] text-faint transition hover:border-line-2 hover:text-ink-2 md:flex"
            >
              <Search size={14} />
              <span className="flex-1 text-left">Search…</span>
              <kbd>⌘K</kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-lg p-2 text-ink-2 hover:bg-ink/5 md:hidden"
              aria-label="Search"
            >
              <Search size={17} />
            </button>

            <div className="relative">
              <button
                onClick={() => { setBellOpen((o) => !o); setMenuOpen(false); }}
                className="relative rounded-lg p-2 text-ink-2 transition hover:bg-ink/5"
                aria-label={`Notifications, ${unread} unread`}
              >
                <Bell size={17} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[9px] font-bold text-[rgb(var(--c-on-accent))]">
                    {unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {bellOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-xl border border-line bg-card shadow-lift"
                    >
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <span className="font-display text-sm font-semibold text-ink">Notifications</span>
                        <button
                          onClick={() => {
                            actions.markAllRead();
                            toast('All notifications marked as read');
                          }}
                          className="text-xs font-medium text-wine hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[380px] overflow-y-auto">
                        {work.notifications.slice(0, 6).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => { actions.markRead(n.id); setBellOpen(false); nav('/app/notifications'); }}
                            className={cn(
                              'flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left transition last:border-0 hover:bg-ink/3',
                              !n.read && 'bg-wine-soft/40'
                            )}
                          >
                            <NotificationIcon type={n.type} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-ink">{n.title}</span>
                              <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-faint">{n.body}</span>
                              <span className="mt-1 block text-[10px] text-faint">{relTime(n.time)}</span>
                            </span>
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-wine" />}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => { setBellOpen(false); nav('/app/notifications'); }}
                        className="w-full border-t border-line bg-card-2/60 py-2.5 text-xs font-medium text-wine hover:bg-wine-soft/50"
                      >
                        View all notifications
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="relative">
              <button
                onClick={() => { setMenuOpen((o) => !o); setBellOpen(false); }}
                className="rounded-full ring-2 ring-transparent transition hover:ring-wine/30"
                aria-label="Account menu"
              >
                <Avatar name={session.name} size={32} online src={session.avatar} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-card shadow-lift"
                    >
                      <div className="border-b border-line px-4 py-3">
                        <div className="truncate text-[13px] font-semibold text-ink">{session.name}</div>
                        <div className="truncate text-xs text-faint">{session.email}</div>
                      </div>
                      {mode === 'api' ? (
                        <div className="border-b border-line px-4 py-2.5 text-[11px] text-faint">
                          Signed in with the ResearchFlow API · {session.email}
                        </div>
                      ) : (
                        <div className="border-b border-line px-4 py-2.5">
                          <div className="pb-1 text-[10px] font-semibold tracking-wider text-faint uppercase">
                            Demo · switch role
                          </div>
                          <div className="flex gap-1.5">
                            {['researcher', 'supervisor', 'admin'].map((r) => (
                              <button
                                key={r}
                                onClick={() => { switchRole(r); setMenuOpen(false); toast(`Viewing as ${ROLE_LABEL[r]}`, 'info'); }}
                                className={cn(
                                  'flex-1 rounded-md border px-2 py-1.5 text-[11px] font-medium transition',
                                  session.role === r
                                    ? 'border-wine/40 bg-wine-soft text-wine'
                                    : 'border-line text-ink-2 hover:border-line-2'
                                )}
                              >
                                {r === 'researcher' ? 'Research' : r === 'supervisor' ? 'Supervise' : 'Admin'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="p-1.5">
                        <Link to="/app/profile" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-ink/5">
                          <UserRound size={15} /> Profile
                        </Link>
                        <Link to="/app/settings" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-ink-2 hover:bg-ink/5">
                          <Settings2 size={15} /> Settings
                        </Link>
                        <button
                          onClick={() => { clearToken(); setSession(null); nav('/'); }}
                          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-rust hover:bg-rust/10"
                        >
                          <LogOut size={15} /> Sign out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main data-scroll className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
    </div>
  );
}

function SearchPanel({ onClose }) {
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);
  const { work, users, user } = useWork();
  const nav = useNavigate();
  useEffect(() => inputRef.current?.focus(), []);

  const ql = q.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!ql) return [];
    const pick = (label, items) => (items.length ? [{ label, items }] : []);
    return [
      ...pick('Projects', work.projects.filter((p) => p.title.toLowerCase().includes(ql)).map((p) => ({ id: p.id, label: p.title, to: `/app/projects/${p.id}`, icon: FolderOpen }))),
      ...pick('Tasks', work.tasks.filter((t) => t.title.toLowerCase().includes(ql)).slice(0, 5).map((t) => ({ id: t.id, label: t.title, to: `/app/projects/${t.projectId}/tasks`, icon: ListChecks }))),
      ...pick('Documents', work.documents.filter((d) => d.name.toLowerCase().includes(ql)).slice(0, 5).map((d) => ({ id: d.id, label: d.name, to: `/app/projects/${d.projectId}/documents`, icon: FileText }))),
      ...pick('Experiments', work.experiments.filter((e) => e.title.toLowerCase().includes(ql)).slice(0, 5).map((e) => ({ id: e.id, label: e.title, to: `/app/projects/${e.projectId}/experiments`, icon: FlaskConical }))),
      ...pick('Findings', work.findings.filter((f) => f.title.toLowerCase().includes(ql)).slice(0, 5).map((f) => ({ id: f.id, label: f.title, to: `/app/projects/${f.projectId}/findings`, icon: Sparkles }))),
      ...pick('People', users.filter((u) => u.name.toLowerCase().includes(ql) || u.institution.toLowerCase().includes(ql)).slice(0, 4).map((u) => ({ id: u.id, label: `${u.name} — ${u.institution}`, to: '/app/researchers', icon: UserRound }))),
    ].flat();
  }, [ql, work, users]);

  const flat = groups.flatMap((g) => g.items);

  const go = (item) => {
    onClose();
    nav(item.to);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <motion.div
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] dark:bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-card shadow-lift"
      >
        <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={16} className="text-faint" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setIdx(0); }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(flat.length - 1, i + 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === 'Enter' && flat[idx]) go(flat[idx]);
            }}
            placeholder="Search projects, tasks, documents, experiments, people…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            aria-label="Global search"
          />
          <kbd>esc</kbd>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {!ql && (
            <div className="px-3 py-8 text-center text-sm text-faint">
              Type to search across your research workspace.
            </div>
          )}
          {ql && flat.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-faint">
              No results for “{q}”.
            </div>
          )}
          {groups.map((g) => (
            <div key={g.label} className="mb-2">
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-[0.14em] text-faint uppercase">{g.label}</div>
              {g.items.map((item) => {
                const i = flat.indexOf(item);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => go(item)}
                    onMouseEnter={() => setIdx(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition',
                      i === idx ? 'bg-wine-soft text-wine' : 'text-ink-2'
                    )}
                  >
                    <Icon size={15} className="shrink-0 opacity-70" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
