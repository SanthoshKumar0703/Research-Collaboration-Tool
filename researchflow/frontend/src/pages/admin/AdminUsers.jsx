import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, UserPlus } from 'lucide-react';
import { useWork } from '../../lib/work';
import { api, hasApi } from '../../lib/api';
import { useToast } from '../../lib/toast';
import { Avatar, Badge, Field, Modal, PageHeader, Switch } from '../../components/ui';
import { cn, fmtDate } from '../../lib/utils';

const PER_PAGE = 8;

export default function AdminUsers() {
  const { work, users, mode, refresh } = useWork();
  const live = mode === 'api';
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [inv, setInv] = useState(false);
  const [email, setEmail] = useState('');
  const [roles, setRoles] = useState(Object.fromEntries(users.map((u) => [u.id, u.role])));
  const [active, setActive] = useState(Object.fromEntries(users.map((u) => [u.id, true])));

  // In API mode the user's real status drives the Active/Suspended state.
  useEffect(() => {
    if (!live) return;
    setActive(Object.fromEntries(users.map((u) => [u.id, u.status !== 'suspended'])));
    setRoles(Object.fromEntries(users.map((u) => [u.id, u.role])));
  }, [users, live]);

  const filtered = useMemo(() => {
    let list = users.filter(
      (u) =>
        (u.name + u.email + u.institution).toLowerCase().includes(q.toLowerCase()) &&
        (role === 'all' || roles[u.id] === role)
    );
    if (sort === 'newest') list = [...list].sort((a, b) => +new Date(b.joined) - +new Date(a.joined));
    if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'oldest') list = [...list].sort((a, b) => +new Date(a.joined) - +new Date(b.joined));
    return list;
  }, [q, role, sort, users, roles]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const slice = filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);

  const projectsOf = (id) => work.projects.filter((p) => p.members.includes(id)).length;

  return (
    <div className="mx-auto max-w-[1100px]">
      <PageHeader
        title="Users"
        sub={`${users.length} accounts · ${users.filter((u) => u.role === 'researcher').length} researchers · ${users.filter((u) => u.role === 'supervisor').length} supervisors`}
        actions={
          <button className="btn-primary" onClick={() => setInv(true)}>
            <UserPlus size={15} /> Invite User
          </button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <Search size={14} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-faint" />
          <input className="input w-56 pl-9 text-[12.5px]" placeholder="Search users…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <select className="input w-auto py-2 text-[12.5px]" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Filter by role">
          <option value="all">All roles</option>
          <option value="researcher">Researcher</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
        </select>
        <select className="input w-auto py-2 text-[12.5px]" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A–Z</option>
        </select>
        <span className="ml-auto text-[12px] text-faint">
          {filtered.length} results · page {cur}/{pages}
        </span>
      </div>

      <div className="card overflow-hidden">
        <div className="hidden grid-cols-[1.5fr_1.2fr_0.7fr_0.7fr_1fr_0.6fr] gap-3 border-b border-line bg-card-2/60 px-5 py-2.5 text-[10.5px] font-semibold tracking-wider text-faint uppercase lg:grid">
          <span>User</span><span>Institution</span><span>Projects</span><span>Status</span><span>Role</span><span>Joined</span>
        </div>
        {slice.map((u) => (
          <div key={u.id} className="grid grid-cols-1 gap-3 border-b border-line px-5 py-3.5 transition-colors last:border-0 hover:bg-ink/2 lg:grid-cols-[1.5fr_1.2fr_0.7fr_0.7fr_1fr_0.6fr] lg:items-center">
            <div className="flex items-center gap-3">
              <Avatar name={u.name} size={34} online={!!active[u.id]} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-medium text-ink">{u.name}</div>
                <div className="truncate text-[11.5px] text-faint">{u.email}</div>
              </div>
            </div>
            <div className="truncate text-[12.5px] text-ink-2">{u.institution}</div>
            <div className="text-[13px] font-medium text-ink-2">{projectsOf(u.id)}</div>
            <div>
              <span className={cn('chip text-[10.5px]', active[u.id] ? 'border-moss/30 text-moss' : 'border-line text-faint')}>
                {active[u.id] ? 'Active' : 'Suspended'}
              </span>
            </div>
            <div>
              <select
                className="input w-auto py-1.5 text-[12px]"
                value={roles[u.id]}
                onChange={(e) => {
                  setRoles({ ...roles, [u.id]: e.target.value });
                  if (live) {
                    api(`/api/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: e.target.value } })
                      .then(refresh)
                      .then(() => toast(`${u.name} is now ${e.target.value} (role change logged)`))
                      .catch((er) => toast(er.message || 'Could not change the role.', 'err'));
                    return;
                  }
                  toast(`${u.name} is now ${e.target.value} (role change logged)`);
                }}
                aria-label={`Role for ${u.name}`}
              >
                <option value="researcher">Researcher</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11.5px] text-faint">{fmtDate(u.joined)}</span>
              <Switch
                checked={!!active[u.id]}
                onChange={(v) => {
                  setActive({ ...active, [u.id]: v });
                  if (live) {
                    api(`/api/admin/users/${u.id}/${v ? 'activate' : 'suspend'}`, { method: 'POST' })
                      .then(refresh)
                      .then(() => toast(v ? `${u.name} reactivated` : `${u.name} suspended`, v ? 'ok' : 'info'))
                      .catch((er) => toast(er.message || 'Action failed.', 'err'));
                    return;
                  }
                  toast(v ? `${u.name} reactivated` : `${u.name} suspended`, v ? 'ok' : 'info');
                }}
                label={`Toggle ${u.name}`}
              />
            </div>
          </div>
        ))}
        {slice.length === 0 && (
          <div className="px-6 py-12 text-center text-[13px] text-faint">No users match the current filters.</div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button className="btn-ghost px-2.5 py-1.5" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Previous page">
          <ChevronLeft size={15} />
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={cn('h-8 w-8 rounded-lg text-[12.5px] font-medium transition', n === cur ? 'bg-wine text-[rgb(var(--c-on-accent))]' : 'text-ink-2 hover:bg-ink/5')}
          >
            {n}
          </button>
        ))}
        <button className="btn-ghost px-2.5 py-1.5" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Next page">
          <ChevronRight size={15} />
        </button>
      </div>

      <Modal
        open={inv}
        onClose={() => setInv(false)}
        title="Invite user"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setInv(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => {
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Enter a valid email.', 'err'); return; }
                if (live) {
                  api('/api/admin/users/invite', { method: 'POST', body: { name: email.split('@')[0].replace(/[._]/g, ' '), email, role: 'researcher' } })
                    .then(refresh)
                    .then((r) => {
                      setInv(false);
                      setEmail('');
                      toast(r.temp_password ? `Account created for ${email} — temporary password: ${r.temp_password} (OTP_DEBUG)` : `Invitation sent to ${email}`, 'ok');
                    })
                    .catch((er) => toast(er.message || 'Could not send the invite.', 'err'));
                  return;
                }
                setInv(false);
                setEmail('');
                toast(`Invitation sent to ${email}`);
              }}
            >
              <UserPlus size={14} /> Send Invite
            </button>
          </>
        }
      >
        <Field label="Email" hint="Admin invites are the only way to provision administrator accounts.">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@university.edu" autoFocus />
        </Field>
      </Modal>
    </div>
  );
}
