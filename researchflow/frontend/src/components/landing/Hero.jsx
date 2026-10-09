import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, CheckCircle2, FileText, FlaskConical, Sparkles } from 'lucide-react';
import { Avatar, Ring } from '../ui';

const TICKER = [
  { icon: FileText, cls: 'text-copper bg-copper-soft', text: 'Dataset uploaded', meta: 'metadata v3 · Gopika', time: '2m' },
  { icon: FlaskConical, cls: 'text-moss bg-moss/10', text: 'Experiment completed', meta: 'EfficientNet-B4 · fold 1', time: '18m' },
  { icon: Sparkles, cls: 'text-wine bg-wine-soft', text: 'Finding added', meta: 'attention sensitivity', time: '1h' },
  { icon: CheckCircle2, cls: 'text-gold bg-gold-soft', text: 'Paper reviewed', meta: 'Literature Review v3', time: '3h' },
];

const MINI = {
  0: ['Annotate 300 images', 'Prepare ablation plan', 'Sensitivity protocol'],
  1: ['Tune fold-3 params', 'Clean metadata', 'Related-work draft'],
  2: ['Baseline ResNet', 'Data pipeline', 'Tracking config'],
};

function FloatingChip({ className, delay, tone, title, meta }) {
  return (
    <motion.div
      className={`card absolute z-10 flex items-center gap-2.5 px-3.5 py-2.5 shadow-lift ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <span className={`h-2 w-2 rounded-full ${tone}`} />
      <span>
        <span className="block text-[11.5px] leading-tight font-semibold text-ink">{title}</span>
        <span className="block text-[10px] text-faint">{meta}</span>
      </span>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="aurora-bg relative overflow-hidden pt-[136px] pb-20 lg:pt-[168px] lg:pb-28">
      {/* backdrop */}
      <div className="editorial-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(75%_60%_at_50%_20%,black,transparent)]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-wine/8 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-12 lg:gap-8 lg:px-8">
        {/* Copy */}
        <div className="lg:col-span-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-copper/30 bg-copper-soft/60 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-copper uppercase"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-copper" />
            The research operating system
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="mt-6 font-display text-[42px] leading-[1.06] font-semibold tracking-tight text-ink sm:text-6xl lg:text-[66px]"
          >
            Where research
            <br />
            <em className="text-wine italic">moves forward.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16 }}
            className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink-2"
          >
            A unified workspace for researchers, students, supervisors, and research teams to
            plan research, collaborate, organize knowledge, track experiments, and turn ideas
            into meaningful findings.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link to="/register" className="btn-primary px-6 py-3 text-[15px]">
              Start Researching
              <ArrowRight size={16} />
            </Link>
            <a href="/#platform" className="btn-outline px-6 py-3 text-[15px]">
              Explore Platform
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-9 flex items-center gap-3"
          >
            <span className="flex items-center">
              {['Dr. Meera Nair', 'Santhosh Kumar', 'Gopika Raman'].map((n, i) => (
                <span key={n} style={{ marginLeft: i ? -9 : 0 }}>
                  <Avatar name={n} size={28} ring />
                </span>
              ))}
            </span>
            <span className="text-[13px] text-faint">
              Built with researchers · free for academic teams
            </span>
          </motion.div>
        </div>

        {/* Product visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative lg:col-span-6"
        >
          <div className="pointer-events-none absolute -inset-10 rounded-[40px] bg-[radial-gradient(55%_45%_at_60%_40%,rgb(var(--c-wine)/0.16),transparent)] blur-2xl" />

          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
            className="card relative overflow-hidden shadow-lift"
          >
            {/* window chrome */}
            <div className="flex items-center gap-1.5 border-b border-line bg-card-2/70 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rust/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-moss/70" />
              <span className="ml-3 font-mono text-[10.5px] text-faint">researchflow.app/workspace/p1</span>
              <span className="ml-auto flex items-center">
                {['Dr. Meera Nair', 'Gopika Raman', 'Santhosh Kumar'].map((n, i) => (
                  <span key={n} style={{ marginLeft: i ? -7 : 0 }}>
                    <Avatar name={n} size={20} ring />
                  </span>
                ))}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_196px]">
              <div className="space-y-3.5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[9.5px] font-semibold tracking-[0.16em] text-faint uppercase">
                      Research project
                    </div>
                    <div className="mt-0.5 truncate font-display text-[16.5px] font-semibold text-ink">
                      AI-Based Medical Diagnosis
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="chip text-[10.5px]">24 tasks</span>
                      <span className="chip text-[10.5px]">12 experiments</span>
                      <span className="chip border-wine/25 bg-wine-soft text-[10.5px] text-wine">Active</span>
                    </div>
                  </div>
                  <Ring value={78} size={54} stroke={5} />
                </div>

                {/* mini kanban */}
                <div className="grid grid-cols-3 gap-2">
                  {['To Do', 'In Progress', 'Done'].map((col, ci) => (
                    <div key={col} className="rounded-lg border border-line bg-paper-soft/60 p-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[8.5px] font-semibold tracking-wider text-faint uppercase">{col}</span>
                        <span className="text-[8.5px] text-faint">{[3, 3, 3][ci]}</span>
                      </div>
                      <div className="space-y-1.5">
                        {MINI[ci].map((c, i) => (
                          <div
                            key={c}
                            className="rounded-md border border-line bg-card p-1.5 shadow-soft"
                            style={{ transform: `rotate(${(i % 2 ? -1 : 1) * 0.4}deg)` }}
                          >
                            <div className="h-1.5 w-4/5 rounded-full bg-ink/15" />
                            <div className="mt-1 h-1.5 w-3/5 rounded-full bg-ink/8" />
                            <div className={`mt-1.5 h-1 w-2/5 rounded-full ${ci === 2 ? 'bg-moss/60' : ci === 1 ? 'bg-amber/60' : 'bg-line-2'}`} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* milestone */}
                <div className="rounded-lg border border-line bg-card-2/50 px-3 py-2.5">
                  <div className="flex items-center justify-between text-[10px] text-faint">
                    <span className="font-medium text-ink-2">Upcoming milestone · Model Evaluation</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock size={10.5} /> due 9/30
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/8">
                    <motion.div
                      className="h-full rounded-full bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: '40%' }}
                      transition={{ duration: 1.4, delay: 0.9 }}
                    />
                  </div>
                </div>
              </div>

              {/* activity rail */}
              <div className="hidden border-l border-line bg-card-2/40 p-3.5 sm:block">
                <div className="text-[9.5px] font-semibold tracking-[0.16em] text-faint uppercase">
                  Live activity
                </div>
                <div className="mt-3 space-y-3">
                  {TICKER.map((a, i) => {
                    const Icon = a.icon;
                    return (
                      <motion.div
                        key={a.text}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + i * 0.3, duration: 0.5 }}
                        className="flex items-start gap-2.5"
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${a.cls}`}>
                          <Icon size={13} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] leading-tight font-medium text-ink">{a.text}</span>
                          <span className="block truncate text-[10px] text-faint">{a.meta}</span>
                          <span className="text-[9px] text-faint/70">{a.time} ago</span>
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          <FloatingChip
            className="-left-4 top-[40%] sm:-left-10"
            delay={0.4}
            tone="bg-moss"
            title="Experiment completed"
            meta="EfficientNet-B4 · acc 0.891"
          />
          <FloatingChip
            className="-right-6 top-[56%] sm:-right-12"
            delay={1.6}
            tone="bg-gold"
            title="New finding added"
            meta="Spatial attention · e3"
          />
          <FloatingChip
            className="-bottom-5 left-8"
            delay={2.6}
            tone="bg-wine"
            title="Deadline in 37 days"
            meta="Model Evaluation milestone"
          />
        </motion.div>
      </div>

      {/* marquee */}
      <div className="relative mt-20 overflow-hidden border-y border-line bg-paper-soft/50 py-4 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-10 pr-10">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex items-center gap-10" aria-hidden={dup === 1}>
              {['Genomics', 'Machine Learning', 'Clinical AI', 'Materials Science', 'NLP', 'Robotics', 'Climate Modeling', 'Quantum Computing', 'Biostatistics', 'Human-Computer Interaction'].map((f) => (
                <span key={f} className="flex items-center gap-10 font-display text-[15px] whitespace-nowrap text-faint italic">
                  {f}
                  <span className="h-1 w-1 rounded-full bg-copper/50" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
