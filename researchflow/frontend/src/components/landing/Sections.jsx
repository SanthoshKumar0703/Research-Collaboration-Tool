import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip,
} from 'recharts';
import {
  ArrowRight, Bell, BookOpen, Brain, CalendarClock, Check, ClipboardCheck, Compass,
  Database, Files, Flag, FlaskConical, FolderOpen, GitBranch, Layers, LineChart,
  ListChecks, Lock, MessagesSquare, Microscope, Network, PenLine, ScanSearch,
  ShieldCheck, Sparkles, Target, TestTubes, UserPlus, Users, Zap,
} from 'lucide-react';
import { Avatar, AvatarStack, Badge, Progress, Reveal, Ring, SectionHead, StatusPill } from '../ui';
import { usePalette, R } from '../../lib/palette';
import { WEEKLY_ACTIVITY } from '../../lib/mock';

/* ── 1. Problem ───────────────────────────────────────────────── */
export function Problem() {
  const pains = [
    { n: '01', t: 'Fragmented context', d: 'Files in Drive, tasks in Trello, discussions in Slack, experiments in notebooks — decisions take days to surface because the pieces never sit together.' },
    { n: '02', t: 'Invisible progress', d: 'Supervisors can’t see real status, so researchers spend hours reporting it. Both sides work from a picture that is already stale.' },
    { n: '03', t: 'Unstructured experiments', d: 'Parameters, datasets and results live in throwaway scripts. You can’t trace a finding back to the exact run that produced it.' },
    { n: '04', t: 'Lost knowledge', d: 'Papers, references and earlier results are never linked to the work they support — every new member starts from zero.' },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" id="problem">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead
            eyebrow="The research problem"
            title={<>Research is advancing.<br /><em className="text-wine italic">Your tools aren’t.</em></>}
            sub="A PhD takes four years. The software your team coordinates with was designed for a four-week sprint."
          />
          <Reveal delay={0.2} className="mt-8 lg:hidden">
            <div className="editorial-grid card p-6" />
          </Reveal>
        </div>
        <div className="lg:col-span-7">
          <div className="space-y-0">
            {pains.map((p, i) => (
              <Reveal key={p.n} delay={i * 0.08}>
                <div className="group grid grid-cols-[64px_1fr] gap-5 border-t border-line py-7 transition-colors last:border-b hover:bg-ink/2 sm:grid-cols-[80px_1fr]">
                  <div className="font-display text-2xl text-faint/60 transition-colors group-hover:text-copper sm:text-3xl">{p.n}</div>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-ink">{p.t}</h3>
                    <p className="mt-2 max-w-xl text-[14.5px] leading-relaxed text-ink-2">{p.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 2. Why / bento ───────────────────────────────────────────── */
function BentoTile({ className, children, delay = 0 }) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="card group h-full p-6 transition-shadow duration-300 hover:shadow-lift lg:p-7">{children}</div>
    </Reveal>
  );
}

export function Why() {
  return (
    <section id="why" className="bg-paper-soft/40 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHead
          center
          eyebrow="Why ResearchFlow"
          title={<>One workspace for the<br />entire research cycle.</>}
          sub="From the first research question to the final manuscript — every artefact lives in one connected place."
        />
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <BentoTile className="md:col-span-4">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-wine-soft text-wine"><Layers size={19} /></span>
                <h3 className="mt-4 font-display text-[22px] font-semibold text-ink">The whole research cycle, connected</h3>
                <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-ink-2">
                  Projects, objectives, milestones, tasks, documents, experiments and findings are one system — not six tools stitched together.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['Idea', 'Plan', 'Collaborate', 'Experiment', 'Discover'].map((s, i, arr) => (
                  <React.Fragment key={s}>
                    <span className="chip bg-card py-1.5 text-[12px] font-medium text-ink">{s}</span>
                    {i < arr.length - 1 && <ArrowRight size={13} className="text-faint" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </BentoTile>
          <BentoTile className="md:col-span-2" delay={0.08}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-copper-soft text-copper"><Users size={19} /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">Real-time collaboration</h3>
            <div className="mt-4 flex items-center gap-2">
              <AvatarStack names={['Santhosh Kumar', 'Gopika Raman', 'Dr. Meera Nair', 'Ananya Krishnan', 'Vikram Shah']} />
              <Badge tone="moss" dot>3 online</Badge>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-faint">Chat, reviews and presence — updates land the moment they happen.</p>
          </BentoTile>
          <BentoTile className="md:col-span-2" delay={0.05}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-soft text-copper"><GitBranch size={19} /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">Versioned documents</h3>
            <div className="mt-4 space-y-1.5">
              {[['v3', 'Literature_Review.pdf', 'current'], ['v2', 'Literature_Review.pdf', ''], ['v1', 'Literature_Review.pdf', '']].map(([v, n, tag], i) => (
                <div key={v} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${i === 0 ? 'border-wine/25 bg-wine-soft/50' : 'border-line bg-card-2/50 opacity-70'}`}>
                  <span className="font-mono text-[10.5px] font-semibold text-wine">{v}</span>
                  <span className="truncate text-[11.5px] text-ink-2">{n}</span>
                  {tag && <span className="ml-auto text-[9px] font-semibold tracking-wider text-wine uppercase">{tag}</span>}
                </div>
              ))}
            </div>
          </BentoTile>
          <BentoTile className="md:col-span-2" delay={0.1}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-moss/10 text-moss"><FlaskConical size={19} /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">Structured experiments</h3>
            <div className="mt-4 rounded-lg border border-line bg-card-2/50 p-3 font-mono text-[11px] text-ink-2">
              <div className="text-faint"># e3 · EfficientNet-B4</div>
              <div className="mt-1.5">acc <span className="text-moss">0.891</span> · auc <span className="text-moss">0.923</span></div>
              <div className="mt-1">→ finding <span className="text-wine">f1</span> adopted</div>
            </div>
            <p className="mt-3 text-[13px] text-faint">Every run traceable to its finding.</p>
          </BentoTile>
          <BentoTile className="md:col-span-2" delay={0.12}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-wine-soft text-wine"><Brain size={19} /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">Local research AI</h3>
            <p className="mt-3 text-[13px] leading-relaxed text-faint">
              Grounded in your project and documents via RAG — running on <span className="font-mono text-[11.5px]">Ollama + Qwen3</span> with no paid API required.
            </p>
            <div className="mt-4 rounded-lg border border-line bg-paper-soft/60 p-3 text-[12px] text-ink-2">
              <span className="text-faint">Ask:</span> “What are the open research gaps?”
            </div>
          </BentoTile>
          <BentoTile className="md:col-span-2" delay={0.14}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ink/6 text-ink-2"><Lock size={19} /></span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">Institutional-grade security</h3>
            <ul className="mt-3 space-y-1.5 text-[13px] text-faint">
              {['Role-based access, enforced server-side', 'Encrypted storage & audit logs', 'Your data stays yours'].map((s) => (
                <li key={s} className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-moss" />{s}</li>
              ))}
            </ul>
          </BentoTile>
        </div>
      </div>
    </section>
  );
}

/* ── 3. Journey ───────────────────────────────────────────────── */
const JOURNEY = [
  { icon: Compass, t: 'Plan', d: 'Define objectives, milestones and tasks around a shared research question.' },
  { icon: MessagesSquare, t: 'Collaborate', d: 'Discuss, review and share documents with the whole team in real time.' },
  { icon: Microscope, t: 'Experiment', d: 'Record every run — parameters, datasets, metrics — and link results to findings.' },
  { icon: Sparkles, t: 'Discover', d: 'Synthesise findings into conclusions and publish with confidence.' },
];

export function Journey() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" id="journey">
      <SectionHead center eyebrow="How it works" title="From idea to discovery." />
      <div className="relative mt-16">
        <div className="absolute top-[27px] right-[12%] left-[12%] hidden h-px bg-line-2 lg:block">
          <motion.div
            className="h-full origin-left bg-wine"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY.map((j, i) => (
            <Reveal key={j.t} delay={i * 0.12} className="relative text-center lg:text-left">
              <div className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-wine/25 bg-card text-wine shadow-soft lg:mx-0">
                <j.icon size={22} />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-wine font-display text-[11px] font-semibold text-[rgb(var(--c-on-accent))]">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{j.t}</h3>
              <p className="mx-auto mt-2 max-w-[260px] text-[13.5px] leading-relaxed text-faint lg:mx-0">{j.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 4. Core capabilities ─────────────────────────────────────── */
const CAPS = [
  { icon: FolderOpen, t: 'Research Projects', d: 'Private workspaces with objectives, methodology, milestones and tags.' },
  { icon: Users, t: 'Team Collaboration', d: 'Members, roles and presence for researchers, supervisors and guests.' },
  { icon: ListChecks, t: 'Tasks & Milestones', d: 'A real Kanban board wired to milestone progress and project health.' },
  { icon: Files, t: 'Research Documents', d: 'A versioned library across papers, datasets, references and results.' },
  { icon: FlaskConical, t: 'Experiments', d: 'Hypothesis, parameters, metrics and outcomes — fully structured.' },
  { icon: Sparkles, t: 'Findings', d: 'Evidence-backed conclusions, each traceable to its experiment.' },
  { icon: MessagesSquare, t: 'Discussions', d: 'Threads with replies, reactions, pins and resolutions.' },
  { icon: CalendarClock, t: 'Meetings', d: 'Agendas, notes, action items and reminders around every sync.' },
  { icon: LineChart, t: 'Analytics', d: 'Live progress, contributions and experiment statistics.' },
  { icon: Brain, t: 'AI Research Assistant', d: 'Project-aware Q&A and document intelligence, on local models.' },
  { icon: Bell, t: 'Real-time Notifications', d: 'In-app, browser and email — nothing slips past the team.' },
];

export function Capabilities() {
  return (
    <section className="bg-paper-soft/40 py-24 lg:py-32" id="features">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHead
              eyebrow="Core capabilities"
              title={<>Everything a research team needs. Nothing it doesn’t.</>}
              sub="Eleven capabilities, one connected workflow. Each one is a full feature — not a bullet point."
            />
            <Reveal delay={0.15} className="mt-8">
              <Link to="/register" className="btn-soft">
                Start researching <ArrowRight size={15} />
              </Link>
            </Reveal>
          </div>
        </div>
        <div className="lg:col-span-8">
          {CAPS.map((c, i) => (
            <Reveal key={c.t} delay={(i % 4) * 0.05}>
              <div className="group flex items-center gap-4 border-t border-line py-4 last:border-b sm:gap-6 sm:py-5">
                <span className="font-mono text-[11px] text-faint/70 w-7">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-card text-ink-2 transition-colors duration-300 group-hover:border-wine/30 group-hover:bg-wine-soft group-hover:text-wine">
                  <c.icon size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-semibold text-ink">{c.t}</h3>
                  <p className="mt-0.5 truncate text-[13px] text-faint">{c.d}</p>
                </div>
                <ArrowRight size={15} className="shrink-0 -translate-x-1 text-faint opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 5. Product preview ───────────────────────────────────────── */
function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-card px-3 py-2 text-xs shadow-lift">
      {label && <div className="mb-1 text-faint">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="text-faint">{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-ink">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function Preview() {
  const p = usePalette();
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" id="platform">
      <SectionHead
        center
        eyebrow="The workspace"
        title={<>A workspace that looks like<br />your research.</>}
      />
      <Reveal delay={0.15} className="relative mt-14">
        <div className="pointer-events-none absolute -inset-8 rounded-[48px] bg-[radial-gradient(50%_50%_at_50%_0%,rgb(var(--c-wine)/0.10),transparent)]" />
        <div className="card relative overflow-hidden shadow-lift">
          {/* window bar */}
          <div className="flex items-center gap-1.5 border-b border-line bg-card-2/70 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rust/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-moss/70" />
            <span className="ml-3 font-mono text-[10.5px] text-faint">researchflow.app/projects/p1</span>
          </div>
          <div className="grid grid-cols-12">
            {/* mini sidebar */}
            <div className="col-span-3 hidden border-r border-line bg-card-2/40 p-4 md:block">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-wine" />
                <span className="text-[11px] font-semibold text-ink">ResearchFlow</span>
              </div>
              <div className="space-y-1">
                {[
                  [LineChart, 'Analytics', true],
                  [ListChecks, 'Tasks', false],
                  [Files, 'Documents', false],
                  [FlaskConical, 'Experiments', false],
                  [Sparkles, 'Findings', false],
                  [MessagesSquare, 'Team', false],
                  [Brain, 'Research AI', false],
                ].map(([Icon, l, act]) => (
                  <div key={l} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] ${act ? 'bg-wine-soft font-medium text-wine' : 'text-faint'}`}>
                    <Icon size={12.5} /> {l}
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-line bg-card p-3">
                <div className="text-[9px] font-semibold tracking-wider text-faint uppercase">Current milestone</div>
                <div className="mt-1 text-[11.5px] font-medium text-ink">Model Evaluation</div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink/8">
                  <div className="h-full w-[40%] rounded-full bg-gold" />
                </div>
              </div>
            </div>
            {/* content */}
            <div className="col-span-12 space-y-4 p-4 md:col-span-9 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-[16px] font-semibold text-ink">AI-Based Medical Diagnosis</div>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusPill status="Active" />
                    <span className="text-[11px] text-faint">Medical AI · due 15 Dec 2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden items-center gap-2 sm:flex">
                    <AvatarStack names={['Santhosh Kumar', 'Gopika Raman', 'Dr. Meera Nair']} size={24} />
                  </div>
                  <Ring value={78} size={46} stroke={4.5} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-card-2/50 p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-faint uppercase">Tasks</div>
                  <div className="mt-1 font-display text-xl font-semibold text-ink">24</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="h-1.5 flex-[3] rounded-full bg-ink/10" />
                    <span className="h-1.5 flex-[6] rounded-full bg-wine" />
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-card-2/50 p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-faint uppercase">Experiments</div>
                  <div className="mt-1 font-display text-xl font-semibold text-ink">12</div>
                  <div className="mt-1 flex gap-1.5">
                    <span className="h-1.5 flex-[5] rounded-full bg-moss" />
                    <span className="h-1.5 flex-[2] rounded-full bg-copper" />
                    <span className="h-1.5 flex-[1] rounded-full bg-rust" />
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-card-2/50 p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-faint uppercase">Upcoming</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[12px] font-medium text-ink">
                    <CalendarClock size={13} className="text-copper" /> Model Evaluation
                  </div>
                  <div className="mt-1 text-[11px] text-faint">due 30 Sep · 37 days</div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-lg border border-line bg-card-2/40 p-3 lg:col-span-3">
                  <div className="mb-2 text-[10px] font-semibold tracking-wider text-faint uppercase">Research activity · 12 weeks</div>
                  <div className="h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={WEEKLY_ACTIVITY} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={R(p.wine)} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={R(p.wine)} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={R(p.line, 0.6)} strokeDasharray="3 3" vertical={false} />
                        <Tooltip content={<Tip />} cursor={{ stroke: R(p.line2) }} />
                        <Area type="monotone" dataKey="events" name="Events" stroke={R(p.wine)} strokeWidth={2} fill="url(#heroGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-lg border border-line bg-card-2/40 p-3 lg:col-span-2">
                  <div className="mb-2 text-[10px] font-semibold tracking-wider text-faint uppercase">Recent activity</div>
                  <div className="space-y-2.5">
                    {[
                      [FileIcon, 'Dataset uploaded', 'metadata v3', '2m'],
                      [FlaskConical, 'Experiment completed', 'EfficientNet-B4 fold 1', '18m'],
                      [PenLine, 'Research paper reviewed', 'Literature Review v3', '3h'],
                    ].map(([Icon, t2, m, time]) => (
                      <div key={t2} className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-wine-soft text-wine"><Icon size={12} /></span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11.5px] font-medium text-ink">{t2}</div>
                          <div className="truncate text-[10px] text-faint">{m}</div>
                        </div>
                        <span className="text-[9.5px] text-faint">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[12.5px] text-faint">
          {['Live dashboards', 'Real-time updates', 'Version history', 'Role-aware views'].map((s) => (
            <span key={s} className="flex items-center gap-1.5"><Check size={13} className="text-moss" />{s}</span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
function FileIcon(props) { return <Files {...props} />; }

/* ── 6. Collaboration ─────────────────────────────────────────── */
export function Collaboration() {
  return (
    <section className="bg-paper-soft/40 py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-12 lg:px-8">
        <div className="order-2 lg:order-1 lg:col-span-6">
          <Reveal>
            <div className="card p-5 shadow-lift sm:p-6">
              <div className="flex items-center justify-between border-b border-line pb-3.5">
                <div>
                  <div className="text-[13px] font-semibold text-ink">Project chat · AI-Based Early Disease Detection</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-faint">
                    <span className="h-1.5 w-1.5 rounded-full bg-moss" /> 3 online
                  </div>
                </div>
                <AvatarStack names={['Dr. Meera Nair', 'Gopika Raman', 'Santhosh Kumar']} size={24} />
              </div>
              <div className="space-y-4 py-4">
                {[
                  { n: 'Dr. Meera Nair', side: 'l', time: '10:42', text: 'Before the sync — can someone verify the age-column fix in metadata v3?', online: true },
                  { n: 'Gopika Raman', side: 'l', time: '10:44', text: 'Done — missing rate is now 0.8% after the consent-form cross-check. CSV v3 is in the library. 👍' },
                  { n: 'You', side: 'r', time: '10:47', text: 'I’ll use v3 for the fold-3 tuning run and post the config here @Gopika Raman' },
                  { n: 'Dr. Meera Nair', side: 'l', time: '10:51', text: 'Perfect. I left two comments on the evaluation protocol draft — they’re in the review queue.' },
                ].map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.15 }}
                    className={`flex gap-2.5 ${m.side === 'r' ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar name={m.n} size={28} online={m.online} />
                    <div className={`max-w-[78%] ${m.side === 'r' ? 'text-right' : ''}`}>
                      <div className="mb-1 flex items-center gap-2 text-[10.5px] text-faint" style={{ flexDirection: m.side === 'r' ? 'row-reverse' : 'row' }}>
                        <span className="font-medium text-ink-2">{m.n}</span>
                        <span>{m.time}</span>
                        {m.side === 'r' && <span className="flex items-center gap-0.5 text-wine">✓✓ read</span>}
                      </div>
                      <div className={`inline-block rounded-xl px-3.5 py-2.5 text-left text-[13px] leading-relaxed ${m.side === 'r' ? 'rounded-tr-sm bg-wine text-[rgb(var(--c-on-accent))]' : 'rounded-tl-sm border border-line bg-card-2/70 text-ink-2'}`}>
                        {m.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper-soft/60 px-3.5 py-2.5 text-[12.5px] text-faint">
                <MessagesSquare size={14} />
                Message the project…
                <span className="ml-auto flex items-center gap-1"><Zap size={12} className="text-copper" /> typing…</span>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-6">
          <SectionHead
            eyebrow="Collaboration"
            title={<>Made for teams<br />that think together.</>}
            sub="Research is a team sport. ResearchFlow keeps the conversation attached to the work it’s about."
          />
          <div className="mt-8 space-y-4">
            {[
              [Zap, 'Instant messaging', 'Real-time chat per project with mentions, file sharing and read state.'],
              [PinIcon, 'Pinned discussions', 'Decisions get pinned where everyone can find them — with replies and reactions.'],
              [ClipboardCheck, 'Document reviews', 'Threaded feedback on every document; status flows from pending to approved.'],
              [Users, 'Presence', 'See who’s online, who’s reviewing, and what the team is doing right now.'],
            ].map(([Icon, t2, d2], i) => (
              <Reveal key={t2} delay={i * 0.08}>
                <div className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wine-soft text-wine"><Icon size={16} /></span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-ink">{t2}</h3>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-faint">{d2}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
function PinIcon(props) { return <Flag {...props} />; }

/* ── 7. Experiments ───────────────────────────────────────────── */
export function ExperimentsSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <div className="grid items-start gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead
            eyebrow="Experiment tracker"
            title={<>Every experiment,<br />accounted for.</>}
            sub="Record the hypothesis, run it, capture the metrics, and connect the result to a finding. Nothing disappears into a notebook."
          />
          <Reveal delay={0.15} className="mt-8">
            <div className="card p-5">
              <div className="text-[11px] font-semibold tracking-wider text-faint uppercase">Traceability</div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="chip bg-moss/10 text-moss"><FlaskConical size={12} /> Experiment e3</span>
                <ArrowRight size={13} className="text-faint" />
                <span className="chip bg-gold-soft text-copper"><Target size={12} /> Finding f1</span>
                <ArrowRight size={13} className="text-faint" />
                <span className="chip bg-wine-soft text-wine"><BookOpen size={12} /> Paper §4.2</span>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="space-y-4 lg:col-span-7">
          {[
            { t: 'EfficientNet-B4 + augmentation', s: 'Running', m: [['acc', '0.891'], ['auc', '0.923']], p: 68 },
            { t: 'Class imbalance — focal loss', s: 'Under Review', m: [['recall+', '+6.2%'], ['fpr', '0.058']], p: 100 },
            { t: 'Synthetic minority generation (GAN)', s: 'Failed', m: [['acc', '0.858']], p: 100 },
          ].map((e, i) => (
            <Reveal key={e.t} delay={i * 0.1}>
              <div className="card group p-5 transition-shadow hover:shadow-lift">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-copper-soft text-copper"><FlaskConical size={17} /></span>
                    <div>
                      <div className="text-[14.5px] font-semibold text-ink">{e.t}</div>
                      <div className="mt-0.5 font-mono text-[10.5px] text-faint">chest_xray_full v2 · {2026}-08</div>
                    </div>
                  </div>
                  <StatusPill status={e.s} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {e.m.map(([k, v]) => (
                    <span key={k} className="rounded-md border border-line bg-card-2/60 px-2 py-1 font-mono text-[11px] text-ink-2">
                      {k} <span className={e.s === 'Failed' ? 'text-rust' : 'text-moss'}>{v}</span>
                    </span>
                  ))}
                  <span className="ml-auto text-[11px] text-faint">{e.p}% complete</span>
                </div>
                <Progress value={e.p} tone={e.s === 'Failed' ? 'copper' : 'wine'} className="mt-2.5" height={4} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 8. Knowledge / documents ─────────────────────────────────── */
export function Knowledge() {
  const cats = [
    ['Research Papers', 14, BookOpen],
    ['Datasets', 9, Database],
    ['References', 22, BookOpen],
    ['Experiment Results', 11, FlaskConical],
    ['Presentations', 6, Files],
    ['Final Documents', 4, PenLine],
  ];
  return (
    <section className="bg-paper-soft/40 py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-6">
          <SectionHead
            eyebrow="Research library"
            title={<>Your entire knowledge base,<br />organized.</>}
            sub="Papers, datasets, references and results — versioned, searchable, and reviewable. Every document carries its history."
          />
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {cats.map(([name, n, Icon], i) => (
              <Reveal key={name} delay={i * 0.05}>
                <div className="card group p-4 transition-colors hover:border-copper/40">
                  <Icon size={17} className="text-copper" />
                  <div className="mt-2.5 text-[12.5px] font-medium text-ink">{name}</div>
                  <div className="text-[11px] text-faint">{n} files</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.12} className="lg:col-span-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-faint uppercase">Recent uploads</span>
              <span className="chip">6 categories</span>
            </div>
            <div className="space-y-2">
              {[
                ['patient_metadata_cleaned.csv', 'Datasets', 'v3', 'Gopika Raman', '2d', 'Changes Requested'],
                ['dp_sgd_benchmarks.pdf', 'Experiment Results', 'v2', 'Ananya Krishnan', '3d', 'Under Review'],
                ['Literature_Review_v3.pdf', 'Research Papers', 'v3', 'Santhosh Kumar', '2d', 'Under Review'],
                ['ethics_approval.pdf', 'References', 'v1', 'Dr. Meera Nair', '70d', 'Approved'],
              ].map(([name, cat, v, up, when, st]) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border border-line bg-card-2/40 px-3.5 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-wine-soft text-wine"><Files size={14} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[12.5px] font-medium text-ink">{name}</span>
                      <span className="rounded bg-ink/6 px-1.5 py-px font-mono text-[9.5px] text-faint dark:bg-white/10">{v}</span>
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-faint">{cat} · {up} · {when}</div>
                  </div>
                  <StatusPill status={st} className="hidden sm:inline-flex" />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 9. Analytics ─────────────────────────────────────────────── */
export function AnalyticsSection() {
  const p = usePalette();
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
      <SectionHead
        center
        eyebrow="Analytics"
        title={<>Progress you can<br />actually see.</>}
        sub="Milestones, contributions, experiment outcomes and deadlines — computed live from real project data."
      />
      <Reveal delay={0.12} className="mt-14">
        <div className="card grid gap-4 p-5 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Project progress', '78%', 'wine'],
            ['Tasks completed', '9 / 24', 'moss'],
            ['Experiments', '7 tracked', 'copper'],
            ['Findings', '4 recorded', 'gold'],
            ['On-time rate', '92%', 'moss'],
            ['Next deadline', '37 days', 'wine'],
          ].map(([l, v, tone], i) => (
            <div key={l} className={`rounded-lg border border-line bg-card-2/40 p-4 ${i === 0 ? 'sm:col-span-3 lg:col-span-2' : ''}`}>
              <div className="text-[10.5px] font-semibold tracking-wider text-faint uppercase">{l}</div>
              <div className={`mt-1.5 font-display text-2xl font-semibold ${tone === 'wine' ? 'text-wine' : tone === 'moss' ? 'text-moss' : tone === 'copper' ? 'text-copper' : 'text-copper'}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <div className="card p-5 lg:col-span-3">
            <div className="mb-3 text-[11px] font-semibold tracking-wider text-faint uppercase">Team contribution · hours this quarter</div>
            <div className="space-y-3.5">
              {[['Santhosh K.', 62, 'wine'], ['Gopika R.', 48, 'copper'], ['Dr. Meera N.', 21, 'gold']].map(([n, h, tone]) => (
                <div key={n}>
                  <div className="mb-1.5 flex justify-between text-[12px]">
                    <span className="font-medium text-ink-2">{n}</span>
                    <span className="text-faint">{h}h</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink/8">
                    <motion.div
                      className={`h-full rounded-full ${tone === 'wine' ? 'bg-wine' : tone === 'copper' ? 'bg-copper' : 'bg-gold'}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(h / 62) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-5 lg:col-span-2">
            <div className="mb-3 text-[11px] font-semibold tracking-wider text-faint uppercase">Experiment outcomes</div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={170}>
                <PieChart>
                  <Pie data={[
                    { name: 'Completed', value: 4, fill: R(p.moss) },
                    { name: 'Running', value: 2, fill: R(p.copper) },
                    { name: 'Under review', value: 1, fill: R(p.gold) },
                    { name: 'Failed', value: 1, fill: R(p.rust) },
                  ]} innerRadius={48} outerRadius={70} paddingAngle={3} strokeWidth={0} dataKey="value" isAnimationActive>
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-faint">
              {[['Completed', 'moss'], ['Running', 'copper'], ['Under review', 'gold'], ['Failed', 'rust']].map(([l, t]) => (
                <span key={l} className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${t === 'moss' ? 'bg-moss' : t === 'copper' ? 'bg-copper' : t === 'gold' ? 'bg-gold' : 'bg-rust'}`} />
                  {l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 10. AI ───────────────────────────────────────────────────── */
export function AISection() {
  return (
    <section id="ai" className="relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_40%,rgb(var(--c-wine)/0.07),transparent)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <SectionHead
            eyebrow="Research AI"
            title={<>An assistant that knows<br />your project.</>}
            sub="Not a generic chatbot. It works from your milestones, tasks, experiments and documents — and says so when it doesn’t know."
          />
          <div className="mt-8 space-y-3.5">
            {[
              [ScanSearch, 'Grounded in your data', 'RAG over your document library — answers cite real sources, never invent them.'],
              [Brain, 'Project-aware context', 'Opened inside a project, it understands that project’s state and history.'],
              [Lock, 'Local & private', 'Runs on Ollama + Qwen3 on your own infrastructure. No paid API, no data leaving.'],
            ].map(([Icon, t2, d2], i) => (
              <Reveal key={t2} delay={i * 0.08}>
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wine-soft text-wine"><Icon size={16} /></span>
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-ink">{t2}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-faint">{d2}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal delay={0.1} className="lg:col-span-7">
          <div className="card overflow-hidden shadow-lift">
            <div className="flex items-center justify-between border-b border-line bg-card-2/60 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wine text-[rgb(var(--c-on-accent))]"><Brain size={15} /></span>
                <div>
                  <div className="text-[13px] font-semibold text-ink">Research AI</div>
                  <div className="font-mono text-[10px] text-faint">ollama · qwen3:4b</div>
                </div>
              </div>
              <Badge tone="wine">Working with: AI-Based Early Disease Detection</Badge>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-xl rounded-tr-sm bg-wine px-4 py-2.5 text-[13px] text-[rgb(var(--c-on-accent))]">
                  What are the main research gaps in this project?
                </div>
              </div>
              <div className="max-w-[92%] rounded-xl rounded-tl-sm border border-line bg-card-2/60 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
                <span className="mb-1.5 block font-semibold text-ink">Based on the milestone plan, recorded experiments and findings:</span>
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li><strong className="text-ink">External validation is absent.</strong> All results are internal 5-fold CV; clinical validation hasn’t started.</li>
                  <li><strong className="text-ink">Small-nodule sensitivity.</strong> The attention experiment (e4) is the key differentiator and still <em>Planned</em>.</li>
                  <li><strong className="text-ink">Focal-loss evidence is provisional.</strong> e6 is under review; the FPR trade-off isn’t verified on clean metadata.</li>
                </ol>
                <span className="mt-2 block border-l-2 border-gold pl-2.5 text-faint italic">Suggested: start e4, verify e6 on metadata v3, add a calibration milestone.</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10.5px] text-faint">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss" />
                sources: milestones · 7 experiments · 4 findings · 8 documents
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 11. Roles ────────────────────────────────────────────────── */
export function Roles() {
  const roles = [
    {
      icon: Microscope, t: 'Researcher', tone: 'wine',
      d: 'Focus on research work, tasks, experiments, documents and findings.',
      pts: ['Work on assigned tasks', 'Record experiments & findings', 'Use project-scoped Research AI'],
    },
    {
      icon: GradIcon, t: 'Supervisor', tone: 'copper',
      d: 'Guide research, review submissions, assign tasks and monitor progress.',
      pts: ['Create & manage projects', 'Review documents & experiments', 'Monitor team analytics'],
    },
    {
      icon: Users, t: 'Research Team', tone: 'gold',
      d: 'Collaborate, communicate, share knowledge and track research activity.',
      pts: ['Real-time chat & discussions', 'Shared document library', 'Shared analytics & deadlines'],
    },
  ];
  return (
    <section className="bg-paper-soft/40 py-24 lg:py-32" id="roles">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <SectionHead center eyebrow="Role-based experience" title="Built for every research team." />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {roles.map((r, i) => (
            <Reveal key={r.t} delay={i * 0.1}>
              <div className={`card group h-full p-7 transition-shadow hover:shadow-lift ${i === 1 ? 'md:-mt-4 md:mb-4' : ''}`}>
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${r.tone === 'wine' ? 'bg-wine-soft text-wine' : r.tone === 'copper' ? 'bg-copper-soft text-copper' : 'bg-gold-soft text-copper'}`}>
                  <r.icon size={21} />
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink">{r.t}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{r.d}</p>
                <ul className="mt-5 space-y-2 border-t border-line pt-4">
                  {r.pts.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[13px] text-faint">
                      <Check size={14} className="mt-0.5 shrink-0 text-moss" /> {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
function GradIcon(props) { return <Target {...props} />; }

/* ── 12. Security ─────────────────────────────────────────────── */
export function Security() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32" id="trust">
      <Reveal>
        <div className="overflow-hidden rounded-3xl bg-[#0B1220] text-[#F5F7FF]">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] text-[#38D9FF] uppercase">
                <span className="h-px w-6 bg-[#38D9FF]/50" /> Security & trust
              </div>
              <h2 className="mt-4 font-display text-3xl leading-tight font-semibold sm:text-4xl">
                Institutional-grade trust, by design.
              </h2>
              <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-[#94A3C7]">
                Research data is sensitive. ResearchFlow enforces permissions server-side,
                keeps credentials hashed, and records who did what — always.
              </p>
              <div className="mt-7 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <ShieldCheck size={17} className="text-[#4ADE95]" />
                <span className="text-[13px] text-[#E7ECFB]">RBAC enforced in the API layer — not just the UI.</span>
              </div>
            </div>
            <div className="grid content-center gap-3 sm:grid-cols-2 lg:col-span-7">
              {[
                [Lock, 'Role-based access control', 'Researcher, supervisor and admin scopes enforced on every API call.'],
                [Database, 'Encrypted document storage', 'Files live in object storage with access control; metadata in the database.'],
                [AuditIcon, 'Complete audit logs', 'Registrations, role changes, uploads, reviews — filterable and queryable.'],
                [KeyIcon, 'Secure authentication', 'Hashed passwords, short-lived tokens, email OTP on sign-in, Google SSO.'],
              ].map(([Icon, t2, d2], i) => (
                <div key={t2} className="rounded-xl border border-white/10 bg-white/[0.04] p-4.5 transition-colors hover:bg-white/[0.07]" style={{ padding: 18 }}>
                  <Icon size={17} className="text-[#38D9FF]" />
                  <h3 className="mt-2.5 text-[14px] font-semibold">{t2}</h3>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-[#94A3C7]">{d2}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
function KeyIcon(props) { return <Lock {...props} />; }
function AuditIcon(props) { return <Network {...props} />; }

/* ── 13. CTA ──────────────────────────────────────────────────── */
export function CTA() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-36">
      <div className="editorial-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine/10 blur-3xl" />
      <Reveal className="relative mx-auto max-w-3xl px-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-wine shadow-lift">
          <span className="font-display text-2xl font-semibold text-[rgb(var(--c-on-accent))]">R</span>
        </div>
        <h2 className="mt-8 font-display text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl">
          Start your next<br /><em className="text-wine italic">breakthrough.</em>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed text-ink-2">
          Join the teams turning scattered work into finished research. Free for academic
          teams — set up a project in minutes.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-primary px-7 py-3 text-[15px]">
            Start Researching <ArrowRight size={16} />
          </Link>
          <a href="mailto:hello@researchflow.app" className="btn-outline px-7 py-3 text-[15px]">
            Talk to us
          </a>
        </div>
        <p className="mt-6 text-[12px] text-faint">
          Ollama + Qwen3 local AI · no paid API keys · your data stays yours
        </p>
      </Reveal>
    </section>
  );
}
