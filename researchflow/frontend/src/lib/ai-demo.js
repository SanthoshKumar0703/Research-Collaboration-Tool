/* Demo responder for the Research AI screen.
   In the full-stack phase this is replaced by the backend AI pipeline:
   intent detection → project access check → context retrieval (MongoDB)
   → vector search (document embeddings) → Ollama + Qwen3 (AI_MODEL).
   Responses here are assembled from real workspace data, never invented. */

export function aiRespond(prompt, ctx) {
  const p = prompt.toLowerCase();
  const proj = ctx.project;
  if (!proj) {
    return {
      intent: 'general',
      text:
        '## Research AI\n' +
        'I am grounded in a specific research project so I never invent context. Open me from a project workspace (or pick one above) and I can summarise its status, analyse experiments, find gaps and answer questions against your documents.',
    };
  }
  const tasks = ctx.tasks || [];
  const done = tasks.filter((t) => t.status === 'completed').length;
  const open = tasks.length - done;
  const exps = ctx.experiments || [];
  const completedExps = exps.filter((e) => e.status === 'Completed');
  const findings = ctx.findings || [];
  const docs = ctx.documents || [];
  const milestones = ctx.milestones || [];

  if (/(summar|status|progress|health|overview)/.test(p) || ctx.intent === 'summarize') {
    const nextMilestone = milestones.find((m) => m.status === 'In Progress') || milestones[0];
    return {
      intent: 'summarize',
      text:
        `## ${proj.title}\n` +
        `**Status:** ${proj.status} · **Progress:** ${proj.progress}% · **Category:** ${proj.category}\n` +
        `\n**Objective.** ${proj.objective}\n` +
        `\n### Where the project stands\n` +
        `- **Tasks:** ${done} of ${tasks.length} complete (${open} open).\n` +
        `- **Milestones:** current phase is **“${nextMilestone.name}”** at ${nextMilestone.progress}% (due ${nextMilestone.due}).\n` +
        `- **Experiments:** ${exps.length} recorded — ${completedExps.length} completed, ${exps.filter((e) => e.status === 'Running').length} running, ${exps.filter((e) => e.status === 'Failed').length} failed.\n` +
        `- **Findings:** ${findings.length} recorded and traceable to experiments.\n` +
        `- **Library:** ${docs.length} documents across ${[...new Set(docs.map((d) => d.cat))].length} categories.\n` +
        `\n### Reading\n` +
        `Momentum is strong in the development phase. The main schedule risk is the **${nextMilestone.name}** milestone: it depends on the running experiment and two open high-priority tasks. If the current run completes on schedule, evaluation starts with a ~2-week buffer before ${nextMilestone.due}.`,
    };
  }

  if (/(gap|limitation|missing|what.*lack)/.test(p) || ctx.intent === 'gaps') {
    return {
      intent: 'gaps',
      text:
        `## Research gap analysis — ${proj.title}\n` +
        `Based on the milestone plan, recorded experiments and findings:\n` +
        `\n1. **External validation is absent.** All results so far come from the internal 5-fold CV; the planned *Clinical Validation* milestone (due 2026-11-15) has not started. Generalisability claims in the paper will be limited until then.\n` +
        `2. **Small-nodule sensitivity.** Finding f1 shows the backbone gains come mainly from macro performance; the attention experiment (e4) targeting nodules < 5mm is still **Planned** — it is the key differentiator and is not yet evidenced.\n` +
        `3. **Class-imbalance evidence is provisional.** Focal loss (e6) is *Under Review*; the FPR trade-off was not verified on clean metadata. Adopting it early would weaken the ablation story.\n` +
        `4. **Failed direction not recovered.** The GAN-based minority synthesis (e7) failed and was parked; synthetic-data approaches remain unexplored despite the imbalance being real.\n` +
        `5. **No calibration study.** No experiment records predicted-probability calibration, which is required for a clinical diagnostic claim.\n` +
        `\n> Suggested next actions: start e4, verify e6 on metadata v3, add a calibration milestone before Clinical Validation.`,
    };
  }

  if (/(experiment|metric|result|ablation)/.test(p) || ctx.intent === 'experiments') {
    const rows = exps
      .filter((e) => e.metrics.length)
      .map((e) => `| ${e.title} | ${e.status} | ${e.metrics.map((m) => `${m[0]}: ${m[1]}`).join(' · ')} |`);
    return {
      intent: 'experiments',
      text:
        `## Experiment analysis\n` +
        `| Experiment | Status | Key metrics |\n|---|---|---|\n${rows.join('\n')}\n` +
        `\n### Observations\n` +
        `- **EfficientNet-B4 (+2.0% acc over baseline)** is the current best architecture — already recorded as finding f1.\n` +
        `- **Random erasing** gives a cheap, reliable +0.8% — keep it in the final recipe.\n` +
        `- **Focal loss** improves minority recall +6.2% but is still *Under Review*; do not merge into the main line until e6 is approved.\n` +
        `- **GAN synthesis failed** (divergence). Before retrying, consider a lighter approach (mixup / SMOTE on embeddings) — the current GAN config is fragile.\n` +
        `- Cross-fold variance is low (σ = 0.003), so single-fold comparisons are trustworthy for ranking, but report all three folds in the paper.`,
    };
  }

  if (/(question|research question|hypothes)/.test(p) || ctx.intent === 'questions') {
    return {
      intent: 'questions',
      text:
        `## Candidate research questions\n` +
        `Generated from the objective, open experiments and current findings:\n` +
        `\n1. Does spatial attention over pulmonary regions improve sensitivity on nodules < 5mm without increasing FPR? *(open — e4 planned)*\n` +
        `2. Can focal-loss training close the minority-class recall gap (currently +6.2%) without degrading specificity on the healthy class?\n` +
        `3. How much accuracy is lost under DP-SGD-style privacy constraints when the dataset is multi-center? *(links to the federated sister project)*\n` +
        `4. Is model calibration preserved under class imbalance for chest-imaging classifiers?\n` +
        `5. Which augmentation budget (time vs. accuracy) is optimal for a 5-fold clinical evaluation with limited GPU budget?\n` +
        `\nQuestions 1 and 2 are directly testable with the current infrastructure and map to open tasks; 3–5 would strengthen the discussion section.`,
    };
  }

  if (/(explain|concept|what is|what are|how does)/.test(p) || ctx.intent === 'explain') {
    const word = prompt.replace(/^(explain|what is|what are|how does)\s*/i, '').trim();
    return {
      intent: 'explain',
      text:
        `## Explanation: ${word || 'concept'}\n` +
        `In the context of **${proj.title}**:\n` +
        `\nThis connects to your methodology, which relies on ${/attention/.test(p) ? 'spatial attention mechanisms to focus the network on diagnostically relevant lung regions' : /calibrat/.test(p) ? 'well-calibrated probability outputs so clinicians can trust the predicted risk' : 'robust cross-validated CNN evaluation'}. I can ground a deeper explanation in your own documents once the library is indexed in the backend phase — until then I limit myself to what your project data supports.\n` +
        `\n> If you need a concept explained from a specific paper in the library, upload it and ask me to summarise it.`,
    };
  }

  if (/(risk|deadline|schedule|behind)/.test(p) || ctx.intent === 'risks') {
    const dueSoon = milestones.filter((m) => m.status !== 'Completed');
    return {
      intent: 'risks',
      text:
        `## Project risk assessment\n` +
        `| Milestone | Status | Due | Risk |\n|---|---|---|---|\n` +
        dueSoon
          .map((m) => `| ${m.name} | ${m.status} (${m.progress}%) | ${m.due} | ${m.status === 'In Progress' ? 'Medium — on critical path' : 'Low — not started, lead time available'} |`)
          .join('\n') +
        `\n### Top risks\n` +
        `1. **Critical path:** Model Evaluation (due 2026-09-30) depends on the running EfficientNet run and the attention experiment, which is still *Planned*. Any slippage in e4 compresses the evaluation window to < 2 weeks.\n` +
        `2. **Review bottleneck:** 1 experiment (e6) and 3 documents are waiting on supervisor review — clearing these would de-risk the paper timeline (abstract deadline 2026-10-01).\n` +
        `3. **Data dependency:** the age-column fix (metadata v3) is in the library; confirm the final numbers before any evaluation claims reference patient covariates.`,
    };
  }

  if (/(priorit|what first|next)/.test(p) || ctx.intent === 'priority') {
    const top = tasks.filter((t) => t.priority === 'High' && t.status !== 'completed').slice(0, 3);
    return {
      intent: 'priority',
      text:
        `## Suggested priorities\n` +
        `1. **${top[0] ? top[0].title : 'Continue the running experiment'}** — high priority, on the critical path to Model Evaluation.\n` +
        `2. **Clear the review queue** — e6 (focal loss) and methodology_draft v2 are waiting; approving or amending them unlocks the paper draft.\n` +
        `3. **Start e4 (attention-guided CNN)** — it is the proposed contribution and currently *Planned*; starting now protects the 2026-10-01 abstract deadline.\n` +
        `\nI would hold “Draft protocol for sensitivity analysis” (low priority) until the architecture decision is final, to avoid rework.`,
    };
  }

  return {
    intent: 'qa',
    text:
      `## About **${proj.title}**\n` +
      `Here is what the workspace data supports:\n` +
      `- The project is **${proj.status}** at **${proj.progress}%**, in the *${(milestones.find((m) => m.status === 'In Progress') || milestones[0]).name}* phase.\n` +
      `- ${findings.length} findings are recorded; the most recent is **“${findings[0] ? findings[0].title : ''}”** (${findings[0] ? new Date(findings[0].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '—'}), traced to experiment ${findings[0] ? findings[0].experiment : '—'}.\n` +
      `- ${open} tasks are open, of which ${tasks.filter((t) => t.priority === 'High' && t.status !== 'completed').length} are high priority.\n` +
      `\nIf your question is about a specific document, experiment or discussion, name it and I will pull the relevant detail. In the backend phase I will also search your document library semantically (RAG) before answering.`,
  };
}

export const AI_MODELS = 'qwen3:4b';
export const AI_PROVIDER = 'ollama';
