import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Brain, Check, Copy, FolderOpen, Loader2, Plus, RefreshCw, Send, Sparkles, Trash2, WifiOff,
} from 'lucide-react';
import { useWork } from '../lib/work';
import { Markdown } from '../lib/markdown';
import { aiRespond, AI_MODELS, AI_PROVIDER } from '../lib/ai-demo';
import { api, hasApi } from '../lib/api';
import { Badge } from '../components/ui';
import { useToast } from '../lib/toast';
import { cn, uid } from '../lib/utils';

const QUICK = [
  { label: 'Summarize Research', intent: 'summarize', prompt: 'Summarize the current state of this research project.' },
  { label: 'Find Research Gaps', intent: 'gaps', prompt: 'What are the main research gaps and limitations in this project?' },
  { label: 'Analyze Experiments', intent: 'experiments', prompt: 'Analyse the experiments and their results.' },
  { label: 'Generate Questions', intent: 'questions', prompt: 'Generate candidate research questions from this project.' },
  { label: 'Explain Concept', intent: 'explain', prompt: 'Explain how spatial attention works in this context.' },
  { label: 'Project Health', intent: 'risks', prompt: 'What are the schedule risks and what should we prioritise next?' },
];

function WelcomeMessage({ project, live }) {
  if (!project) {
    return (
      <div className="rounded-xl rounded-tl-sm border border-line bg-card-2/60 px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-wine">
          <Brain size={15} />
          <span className="text-[13px] font-semibold">Research AI</span>
        </div>
        <Markdown
          text={'## Hi, I’m your Research AI\nI ground every answer in a specific research project — milestones, tasks, experiments, findings and documents. **Pick a project** on the left, or ask me anything once one is selected.\n\n- I never invent information\n- I say when more data is needed\n' + (live ? '- Backed by the server: RAG over your documents + your configured model' : '- I run locally: `ollama · qwen3:4b` (no paid API)')}
        />
      </div>
    );
  }
  if (live) {
    return (
      <div className="rounded-xl rounded-tl-sm border border-line bg-card-2/60 px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-wine">
          <Brain size={15} />
          <span className="text-[13px] font-semibold">Research AI</span>
          <span className="text-[10.5px] text-faint">· project context loaded</span>
        </div>
        <Markdown text={'Ask me about this project. Every answer is retrieved from the project’s documents, milestones, experiments and findings — try one of the quick actions below.'} />
      </div>
    );
  }
  if (false && !project) {
    return (
      <div className="rounded-xl rounded-tl-sm border border-line bg-card-2/60 px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-wine">
          <Brain size={15} />
          <span className="text-[13px] font-semibold">Research AI</span>
        </div>
        <Markdown
          text={'## Hi, I’m your Research AI\nI ground every answer in a specific research project — milestones, tasks, experiments, findings and documents. **Pick a project** on the left, or ask me anything once one is selected.\n\n- I never invent information\n- I say when more data is needed\n- I run locally: `ollama · qwen3:4b` (no paid API)'}
        />
      </div>
    );
  }
  const r = aiRespond('Summarize the current state of this research project.', { project, intent: 'summarize' });
  return (
    <div className="rounded-xl rounded-tl-sm border border-line bg-card-2/60 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-wine">
        <Brain size={15} />
        <span className="text-[13px] font-semibold">Research AI</span>
        <span className="text-[10.5px] text-faint">· project context loaded</span>
      </div>
      <Markdown text={r.text} />
    </div>
  );
}

export default function ResearchAI() {
  const { work } = useWork();
  const toast = useToast();
  const live = hasApi();
  const [aiInfo, setAiInfo] = useState(null);
  useEffect(() => {
    if (!live) return;
    api('/api/health')
      .then((h) => setAiInfo({ provider: h.ai_provider, model: h.ai_model }))
      .catch(() => {});
  }, [live]);
  const [projectId, setProjectId] = useState('p1');
  const project = work.projects.find((p) => p.id === projectId);
  const [convs, setConvs] = useState([
    { id: 'c1', projectId: 'p1', title: 'Project overview & gaps', system: false },
    { id: 'c2', projectId: null, title: 'General research help', system: true },
  ]);
  const [activeId, setActiveId] = useState('c1');
  const [msgs, setMsgs] = useState(() =>
    live
      ? { c1: [], c2: [] }
      : {
          c1: [
            { role: 'user', text: 'What are the main research gaps in this project?' },
            { role: 'ai', text: aiRespond('What are the main research gaps in this project?', { project: work.projects[0], intent: 'gaps' }).text },
          ],
          c2: [],
        }
  );
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const timerRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, streamText, activeId]);

  const activeConv = convs.find((c) => c.id === activeId);
  const activeProject = activeConv?.system ? null : work.projects.find((p) => p.id === activeConv?.projectId);

  const ctx = useMemo(
    () => ({
      project: activeProject,
      tasks: work.tasks.filter((t) => t.projectId === activeProject?.id),
      experiments: work.experiments.filter((e) => e.projectId === activeProject?.id),
      findings: work.findings.filter((f) => f.projectId === activeProject?.id),
      documents: work.documents.filter((d) => d.projectId === activeProject?.id),
      milestones: work.milestones.filter((m) => m.projectId === activeProject?.id),
    }),
    [activeProject, work]
  );

  const stream = (full, done) => {
    setStreaming(true);
    setStreamText('');
    let i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i = Math.min(full.length, i + 7 + Math.floor(Math.random() * 8));
      setStreamText(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(timerRef.current);
        setStreamText('');
        setStreaming(false);
        done();
      }
    }, 24);
  };

  const ask = (prompt, intent = null) => {
    if (!prompt.trim() || streaming) return;
    const convId = activeId;
    if (live) {
      if (!activeProject) return toast('Pick a project first — the AI is grounded in one project at a time.', 'info');
      const history = (msgs[convId] || []).slice(-6).map((m) => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
      setMsgs((m) => ({ ...m, [convId]: [...(m[convId] || []), { role: 'user', text: prompt }] }));
      setInput('');
      setStreaming(true);
      setStreamText('');
      api('/api/ai/ask', { method: 'POST', body: { projectId: activeProject.id, message: prompt, history } })
        .then((res) => {
          const text = res.ok
            ? res.text
            : `> ⚠ **AI unavailable** — ${res.fallback || 'Please try again.'}\n\n${res.error ? `\n\n\`detail: ${res.error}\`` : ''}`;
          stream(text, () => {
            setMsgs((m) => ({ ...m, [convId]: [...(m[convId] || []), { role: 'ai', text, sources: res.sources || [] }] }));
          });
        })
        .catch((er) => {
          setStreaming(false);
          setMsgs((m) => ({ ...m, [convId]: [...(m[convId] || []), { role: 'ai', text: `> ⚠ ${er.message || 'Request failed.'}` }] }));
        });
      return;
    }
    const p = intent ? { ...ctx, intent } : ctx;
    const res = aiRespond(prompt, p);
    setMsgs((m) => ({ ...m, [convId]: [...(m[convId] || []), { role: 'user', text: prompt }] }));
    setInput('');
    stream(res.text, () => {
      setMsgs((m) => ({ ...m, [convId]: [...(m[convId] || []), { role: 'ai', text: res.text }] }));
    });
  };

  const newChat = () => {
    const id = uid();
    setConvs((c) => [{ id, projectId, title: 'New conversation', system: false }, ...c]);
    setMsgs((m) => ({ ...m, [id]: [] }));
    setActiveId(id);
  };

  const clear = () => {
    setMsgs((m) => ({ ...m, [activeId]: [] }));
  };

  const copyMsg = (t) => navigator.clipboard?.writeText(t).then(() => {}, () => {});

  return (
    <div className="flex h-full min-h-0">
      {/* Convo rail */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line bg-card-2/40 md:flex">
        <div className="flex items-center justify-between px-4 pt-5 pb-3">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-faint uppercase">Conversations</span>
          <button onClick={newChat} className="rounded-md p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink" aria-label="New conversation">
            <Plus size={15} />
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2.5">
          {convs.map((c) => {
            const p = work.projects.find((x) => x.id === c.projectId);
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  'w-full rounded-lg px-3 py-2.5 text-left transition',
                  c.id === activeId ? 'bg-wine-soft text-wine' : 'text-ink-2 hover:bg-ink/5'
                )}
              >
                <div className="truncate text-[12.5px] font-medium">{c.title}</div>
                <div className="mt-0.5 flex items-center gap-1.5 truncate text-[10.5px] text-faint">
                  <FolderOpen size={10} />
                  {c.system ? 'General (no project)' : p?.title.slice(0, 26) || 'General'}
                </div>
              </button>
            );
          })}
        </div>
        <div className="border-t border-line p-3">
          <div className="rounded-lg border border-dashed border-line-2 bg-paper-soft/50 p-3 text-[10.5px] leading-relaxed text-faint">
            {live ? (
              <>
                <span className="font-semibold text-copper">Live.</span> Answers come from the FastAPI{' '}
                <span className="font-mono">/api/ai/ask</span> pipeline: access check → RAG retrieval (MongoDB chunks) → your
                configured model (Ollama by default). Sources are cited by document name.
              </>
            ) : (
              <>
                <span className="font-semibold text-copper">Demo mode.</span> Responses are generated from your workspace data in
                the browser. Connect the backend (<span className="font-mono">VITE_API_URL</span>) for the real RAG pipeline.
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-wine text-[rgb(var(--c-on-accent))]">
            <Brain size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-[15px] font-semibold text-ink">Research AI</span>
              <Badge tone="neutral" className="font-mono text-[10px]">{live && aiInfo ? `${aiInfo.provider} · ${aiInfo.model}` : `${AI_PROVIDER} · ${AI_MODELS}`}</Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
              {activeProject ? (
                <>Working with: <span className="font-medium text-ink-2">{activeProject.title}</span></>
              ) : (
                'No project context selected'
              )}
            </div>
          </div>
          {!activeConv?.system && (
            <select
              className="input w-auto py-1.5 text-[12px]"
              value={activeConv?.projectId || ''}
              onChange={(e) => {
                const id = uid();
                setConvs((c) => [{ id, projectId: e.target.value, title: 'New conversation', system: false }, ...c]);
                setMsgs((m) => ({ ...m, [id]: [] }));
                setActiveId(id);
              }}
              aria-label="Switch project context"
            >
              {work.projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          )}
          <button
            onClick={clear}
            disabled={streaming || (msgs[activeId] || []).length === 0}
            className="btn-ghost px-2.5 py-1.5 text-[12px]"
            title="Clear conversation"
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {(msgs[activeId] || []).length === 0 && !streaming && (
            <div className={cn('flex gap-2.5', !activeConv?.system && 'flex-row-reverse')}>
              <div className="w-7">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-wine text-[rgb(var(--c-on-accent))]">
                  <Brain size={13} />
                </span>
              </div>
              <div className="max-w-[92%]">
                <WelcomeMessage project={activeProject} live={live} />
              </div>
            </div>
          )}
          {(msgs[activeId] || []).map((m, i) => (
            <div key={i} className={cn('flex gap-2.5', m.role === 'user' ? 'flex-row-reverse' : '')}>
              {m.role === 'ai' && (
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-wine text-[rgb(var(--c-on-accent))]">
                  <Brain size={13} />
                </span>
              )}
              <div className={cn('max-w-[88%] min-w-0', m.role === 'user' ? 'flex flex-col items-end' : 'flex-1')}>
                {m.role === 'user' ? (
                  <div className="rounded-xl rounded-tr-sm bg-wine px-4 py-2.5 text-[13.5px] leading-relaxed text-[rgb(var(--c-on-accent))]">
                    {m.text}
                  </div>
                ) : (
                  <div className="group rounded-xl rounded-tl-sm border border-line bg-card-2/60 px-4 py-3">
                    <Markdown text={m.text} />
                    {m.sources?.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
                        <span className="text-[10px] font-semibold tracking-wider text-faint uppercase">Sources</span>
                        {m.sources.map((s) => (
                          <span key={s} className="rounded-full border border-gold/30 bg-gold-soft/60 px-2 py-0.5 text-[10.5px] font-medium text-copper">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => copyMsg(m.text)} className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] text-faint hover:bg-ink/5 hover:text-ink">
                        <Copy size={11} /> Copy
                      </button>
                      <button
                        onClick={() => {
                          if (live) {
                            ask((msgs[activeId] || [])[idx - 1]?.text || '');
                            return;
                          }
                          const idx = i;
                          const p = ctx;
                          const res = aiRespond((msgs[activeId] || [])[idx - 1]?.text || '', p);
                          setMsgs((mm) => {
                            const list = [...(mm[activeId] || [])];
                            list[idx] = { role: 'ai', text: res.text };
                            return { ...mm, [activeId]: list };
                          });
                        }}
                        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] text-faint hover:bg-ink/5 hover:text-ink"
                      >
                        <RefreshCw size={11} /> Regenerate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-wine text-[rgb(var(--c-on-accent))]">
                <Brain size={13} />
              </span>
              <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm border border-wine/30 bg-wine-soft/30 px-4 py-3">
                {streamText ? (
                  <Markdown text={streamText} />
                ) : (
                  <span className="flex items-center gap-2 text-[12px] text-faint">
                    <Loader2 size={13} className="animate-spin" /> Thinking through the project context…
                  </span>
                )}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick actions */}
        {!activeConv?.system && (
          <div className="flex flex-wrap gap-2 border-t border-line px-5 pt-3">
            {QUICK.map((q) => (
              <button
                key={q.label}
                onClick={() => ask(q.prompt, q.intent)}
                disabled={streaming}
                className="chip transition hover:border-wine/40 hover:text-wine disabled:opacity-50"
              >
                <Sparkles size={11} /> {q.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); ask(input); }}
          className="flex items-center gap-2 px-5 py-4"
        >
          <input
            className="input flex-1"
            placeholder={activeProject ? `Ask about ${activeProject.title}…` : 'Pick a project context first…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={streaming}
            aria-label="Ask Research AI"
          />
          {streaming ? (
            <button type="button" className="btn-outline px-4" onClick={() => { clearInterval(timerRef.current); setStreaming(false); setStreamText(''); }}>
              <Trash2 size={14} /> Stop
            </button>
          ) : (
            <button type="submit" className="btn-primary px-4" disabled={!input.trim()} aria-label="Send">
              <Send size={15} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
