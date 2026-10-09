import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Check, FileText, FlaskConical, Plus, Quote, Sparkles, X } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, EmptyState, Field, Modal, PageHeader, Reveal } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { fmtDate } from '../lib/utils';

export default function Findings({ scope = 'project' }) {
  const { id } = useParams();
  const projectId = scope === 'project' ? id : null;
  const { work, user, actions } = useWork();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', experiment: '', desc: '', evidence: '', interpretation: '', conclusion: '' });

  const findings = work.findings.filter((x) => (projectId ? x.projectId === projectId : true));
  const exps = work.experiments.filter((e) => (projectId ? e.projectId === projectId : true));

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    actions.addFinding({
      projectId: projectId || 'p1',
      title: f.title,
      experiment: f.experiment,
      desc: f.desc,
      evidence: f.evidence,
      result: f.evidence,
      interpretation: f.interpretation,
      conclusion: f.conclusion,
    });
    setOpen(false);
    toast('Finding added to the project record');
    browserNotify('New finding', f.title);
  };

  return (
    <div>
      {scope === 'project' ? (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-faint">
            {findings.length} findings · each traceable to the experiment that produced it
          </p>
          <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Finding</button>
        </div>
      ) : (
        <PageHeader
          title="Findings"
          sub="Evidence-backed conclusions across your projects"
          actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Finding</button>}
        />
      )}

      {findings.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No findings yet."
          desc="When an experiment yields something meaningful, record it here with its evidence and interpretation."
          action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Create Finding</button>}
        />
      ) : (
        <div className="space-y-4">
          {findings.map((fd, i) => {
            const exp = work.experiments.find((e) => e.id === fd.experiment);
            const by = user(fd.by) || { name: 'You' };
            return (
              <Reveal key={fd.id} delay={i * 0.06}>
                <div className="card relative overflow-hidden p-5 lg:p-6">
                  <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-wine to-gold" />
                  <div className="flex flex-wrap items-start justify-between gap-3 pl-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-[16.5px] font-semibold text-ink">{fd.title}</h3>
                        {exp && (
                          <span className="chip border-copper/30 bg-copper-soft/60 text-copper">
                            <FlaskConical size={11} /> {exp.title}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12.5px] text-faint">{fd.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[11.5px] text-faint">
                      <Avatar name={by.name} size={24} />
                      {by.name.split(' ')[0]} · {fmtDate(fd.date)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 pl-3 lg:grid-cols-3">
                    <div className="rounded-lg border border-line bg-paper-soft/50 p-3.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider text-faint uppercase">
                        <Quote size={11} /> Evidence
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{fd.evidence}</p>
                    </div>
                    <div className="rounded-lg border border-line bg-paper-soft/50 p-3.5">
                      <div className="text-[10.5px] font-semibold tracking-wider text-faint uppercase">Interpretation</div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{fd.interpretation}</p>
                    </div>
                    <div className="rounded-lg border border-moss/25 bg-moss/5 p-3.5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wider text-moss uppercase">
                        <Check size={11} /> Conclusion
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-2">{fd.conclusion}</p>
                    </div>
                  </div>

                  {fd.files.length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5 pl-3">
                      {fd.files.map((file) => (
                        <span key={file} className="chip">
                          <FileText size={11} /> {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add finding"
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}><X size={14} /> Cancel</button>
            <button className="btn-primary" onClick={submit}><Check size={14} /> Add Finding</button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Title" required>
            <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Attention improves small-nodule sensitivity" autoFocus />
          </Field>
          <Field label="Related experiment" hint="Traceability: every finding links back to its experiment.">
            <select className="input" value={f.experiment} onChange={(e) => setF({ ...f, experiment: e.target.value })}>
              <option value="">— none —</option>
              {exps.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
            </select>
          </Field>
          <Field label="Description">
            <input className="input" value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="Short summary of the finding" />
          </Field>
          <Field label="Evidence / Result">
            <textarea className="input min-h-[64px]" value={f.evidence} onChange={(e) => setF({ ...f, evidence: e.target.value })} placeholder="Numbers, comparisons, quotes from results…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Interpretation">
              <textarea className="input min-h-[64px]" value={f.interpretation} onChange={(e) => setF({ ...f, interpretation: e.target.value })} placeholder="What does this mean?" />
            </Field>
            <Field label="Conclusion">
              <textarea className="input min-h-[64px]" value={f.conclusion} onChange={(e) => setF({ ...f, conclusion: e.target.value })} placeholder="Decision or next step" />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
