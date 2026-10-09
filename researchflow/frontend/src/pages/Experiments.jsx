import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Beaker, Check, FlaskConical, Plus, Sparkles, X } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Badge, EmptyState, Field, Modal, PageHeader, Progress, StatusPill } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { cn, fmtDate } from '../lib/utils';

const STATUSES = ['All', 'Planned', 'Running', 'Completed', 'Failed', 'Under Review'];
const PCT = { Planned: 5, Running: 62, 'Under Review': 100, Completed: 100, Failed: 100 };

export default function Experiments({ scope = 'project' }) {
  const { id } = useParams();
  const projectId = scope === 'project' ? id : null;
  const { work, actions } = useWork();
  const toast = useToast();
  const [status, setStatus] = useState('All');
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    title: '', objective: '', hypothesis: '', methodology: '', dataset: '',
    parameters: [['', '']], status: 'Planned',
  });

  const exps = useMemo(
    () =>
      work.experiments
        .filter((e) => (projectId ? e.projectId === projectId : true))
        .filter((e) => status === 'All' || e.status === status),
    [work.experiments, projectId, status]
  );

  const setParam = (i, k, v) => {
    const ps = f.parameters.map((p, j) => (j === i ? [p[0] === k ? p : p, v] : p));
    // simpler: parameters is array of [k,v]
    const next = f.parameters.map((p, j) => (j === i ? [k === 'k' ? v : p[0], k === 'v' ? v : p[1]] : p));
    setF({ ...f, parameters: next });
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    actions.addExperiment({
      projectId: projectId || 'p1',
      title: f.title,
      objective: f.objective,
      hypothesis: f.hypothesis,
      methodology: f.methodology,
      dataset: f.dataset || '—',
      parameters: f.parameters.filter((p) => p[0].trim() && p[1].trim()),
      status: f.status,
      date: new Date().toISOString().slice(0, 10),
    });
    setOpen(false);
    toast(`Experiment “${f.title}” recorded`);
    browserNotify('Experiment recorded', `${f.title} (${f.status})`);
  };

  return (
    <div>
      {scope === 'project' ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-faint">
            {work.experiments.filter((e) => e.projectId === projectId).length} experiments · every run traceable to findings
          </p>
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus size={15} /> New Experiment
          </button>
        </div>
      ) : (
        <PageHeader
          title="Experiments"
          sub="All experiments across your projects"
          actions={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus size={15} /> New Experiment
            </button>
          }
        />
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUSES.map((s) => {
          const n = work.experiments.filter((e) => (projectId ? e.projectId === projectId : true) && (s === 'All' || e.status === s)).length;
          return (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                status === s ? 'border-wine/40 bg-wine-soft text-wine' : 'border-line bg-card text-ink-2 hover:border-line-2'
              )}
            >
              {s} <span className="text-faint">{s === 'All' ? n : n > 0 ? `· ${n}` : ''}</span>
            </button>
          );
        })}
      </div>

      {exps.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No experiments recorded yet."
          desc="Record your first run — hypothesis, parameters and metrics — and build the evidence trail."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Create Experiment</button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {exps.map((e) => {
            const findings = work.findings.filter((x) => x.experiment === e.id);
            return (
              <div key={e.id} className="card p-5 transition-shadow hover:shadow-lift">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                      e.status === 'Completed' ? 'bg-moss/10 text-moss' : e.status === 'Failed' ? 'bg-rust/10 text-rust' : e.status === 'Running' ? 'bg-copper-soft text-copper' : e.status === 'Under Review' ? 'bg-gold-soft text-copper' : 'bg-ink/6 text-ink-2'
                    )}>
                      <Beaker size={17} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-[14.5px] font-semibold text-ink">{e.title}</h3>
                      <div className="mt-0.5 text-[11.5px] text-faint">
                        {fmtDate(e.date)} · {e.dataset}{scope === 'global' && ` · ${work.projects.find((p) => p.id === e.projectId)?.title?.slice(0, 28)}`}
                      </div>
                    </div>
                  </div>
                  <StatusPill status={e.status} />
                </div>

                <p className="mt-3.5 border-l-2 border-gold/50 pl-3 text-[12.5px] leading-relaxed text-ink-2 italic">
                  {e.hypothesis}
                </p>

                <div className="mt-3.5 flex flex-wrap gap-1.5">
                  {e.parameters.map(([k, v]) => (
                    <span key={k} className="rounded-md border border-line bg-card-2/60 px-2 py-1 font-mono text-[10.5px] text-ink-2">
                      {k}=<span className="text-wine">{v}</span>
                    </span>
                  ))}
                </div>

                {e.metrics.length > 0 && (
                  <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {e.metrics.map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-line bg-paper-soft/50 px-3 py-2">
                        <div className="text-[10px] tracking-wider text-faint uppercase">{k}</div>
                        <div className={cn('font-mono text-[14px] font-semibold', e.status === 'Failed' ? 'text-rust' : 'text-moss')}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}

                {e.conclusion && (
                  <p className="mt-3.5 text-[12.5px] leading-relaxed text-faint">
                    <span className="font-semibold text-ink-2">Conclusion: </span>{e.conclusion}
                  </p>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-2 text-[11.5px] text-faint">
                    <Progress value={PCT[e.status]} tone={e.status === 'Failed' ? 'copper' : 'wine'} className="w-24" height={4} />
                    {PCT[e.status]}%
                  </div>
                  {findings.length > 0 && (
                    <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-copper">
                      <Sparkles size={12} /> {findings.length} finding{findings.length > 1 ? 's' : ''} traced
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record experiment"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}><X size={14} /> Cancel</button>
            <button className="btn-primary" onClick={submit}><Check size={14} /> Record Experiment</button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Experiment Title" required>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Attention-guided CNN — fold 1" autoFocus />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Objective">
              <input className="input" value={f.objective} onChange={(e) => setF({ ...f, objective: e.target.value })} placeholder="What are you testing?" />
            </Field>
            <Field label="Dataset">
              <input className="input" value={f.dataset} onChange={(e) => setF({ ...f, dataset: e.target.value })} placeholder="chest_xray_full v2" />
            </Field>
          </div>
          <Field label="Hypothesis">
            <input className="input" value={f.hypothesis} onChange={(e) => setF({ ...f, hypothesis: e.target.value })} placeholder="If we … then …" />
          </Field>
          <Field label="Methodology">
            <textarea className="input min-h-[64px]" value={f.methodology} onChange={(e) => setF({ ...f, methodology: e.target.value })} placeholder="Procedure, recipe, controls…" />
          </Field>
          <Field label="Parameters" hint="Each row: key = value">
            <div className="space-y-2">
              {f.parameters.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input className="input flex-1 font-mono text-[12px]" placeholder="lr" value={p[0]} onChange={(e) => setParam(i, 'k', e.target.value)} />
                  <span className="self-center text-faint">=</span>
                  <input className="input flex-1 font-mono text-[12px]" placeholder="0.001" value={p[1]} onChange={(e) => setParam(i, 'v', e.target.value)} />
                  <button
                    type="button"
                    onClick={() => setF({ ...f, parameters: f.parameters.filter((_, j) => j !== i) })}
                    className="rounded-md p-2 text-faint hover:bg-ink/5 hover:text-rust"
                    aria-label="Remove parameter"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setF({ ...f, parameters: [...f.parameters, ['', '']] })}
                className="text-[12px] font-medium text-wine hover:underline"
              >
                + Add parameter
              </button>
            </div>
          </Field>
          <Field label="Status">
            <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {['Planned', 'Running', 'Completed', 'Failed', 'Under Review'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </form>
      </Modal>
    </div>
  );
}
