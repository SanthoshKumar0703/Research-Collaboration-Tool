import React, { useState } from 'react';
import { Brain, Cloud, Cpu, Database, HardDrive, Mail, Save, ShieldCheck } from 'lucide-react';
import { useToast } from '../../lib/toast';
import { useWork } from '../../lib/work';
import { Badge, Field, PageHeader, Progress, Switch } from '../../components/ui';
import { STORAGE as STORAGE_FALLBACK } from '../../lib/mock';

export default function AdminSettings() {
  const toast = useToast();
  const { work, mode } = useWork();
  const STORAGE = mode === 'api' ? work.globalAnalytics?.storage || STORAGE_FALLBACK : STORAGE_FALLBACK;
  const [flags, setFlags] = useState({ ai: true, browser: true, registration: true, digest: false });
  const [model, setModel] = useState('qwen3:4b');
  const [base, setBase] = useState('http://localhost:11434');

  return (
    <div className="mx-auto max-w-[900px]">
      <PageHeader
        title="System Settings"
        sub="Platform configuration · changes are written to the settings collection (MongoDB) in the backend phase"
        actions={<button className="btn-primary" onClick={() => toast('System settings saved')}><Save size={14} /> Save All</button>}
      />

      <div className="space-y-5">
        <div className="card p-6">
          <h3 className="mb-2 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
            <Brain size={16} className="text-copper" /> Research AI
          </h3>
          <p className="mb-4 text-[12.5px] leading-relaxed text-faint">
            The AI pipeline runs on your own infrastructure. No paid model API is required.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="AI provider">
              <select className="input" defaultValue="ollama">
                <option value="ollama">Ollama (local)</option>
                <option value="openai" disabled>OpenAI (optional)</option>
                <option value="anthropic" disabled>Anthropic (optional)</option>
                <option value="google" disabled>Google (optional)</option>
                <option value="xai" disabled>xAI (optional)</option>
              </select>
            </Field>
            <Field label="Model (AI_MODEL)">
              <input className="input font-mono text-[12.5px]" value={model} onChange={(e) => setModel(e.target.value)} />
            </Field>
            <Field label="Ollama base URL">
              <input className="input font-mono text-[12.5px]" value={base} onChange={(e) => setBase(e.target.value)} />
            </Field>
            <div className="flex items-end">
              <button
                className="btn-outline w-full"
                onClick={() => toast(`Ollama reachable at ${base} — model “${model}” listed (simulated check)`, 'info')}
              >
                <Cpu size={14} /> Test Connection
              </button>
            </div>
          </div>
          <div className="mt-4">
            <Row title="Enable Research AI" desc="Turn off to hide the AI screen without deleting data.">
              <Switch checked={flags.ai} onChange={(v) => setFlags({ ...flags, ai: v })} />
            </Row>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-2 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
            <ShieldCheck size={16} className="text-copper" /> Platform
          </h3>
          <Row title="Public registration" desc="Allow researchers and supervisors to self-register. Admins are always invite-only.">
            <Switch checked={flags.registration} onChange={(v) => setFlags({ ...flags, registration: v })} />
          </Row>
          <Row title="Browser push notifications" desc="Service worker + VAPID push for background alerts.">
            <Switch checked={flags.browser} onChange={(v) => setFlags({ ...flags, browser: v })} />
          </Row>
          <Row title="Weekly research digest" desc="Monday summary email to every active member.">
            <Switch checked={flags.digest} onChange={(v) => setFlags({ ...flags, digest: v })} />
          </Row>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="card p-6">
            <h3 className="mb-3 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
              <Database size={16} className="text-copper" /> Database
            </h3>
            <div className="space-y-2 text-[12.5px] text-ink-2">
              <div className="flex justify-between"><span className="text-faint">Engine</span> <span className="font-mono">MongoDB 7</span></div>
              <div className="flex justify-between"><span className="text-faint">Status</span> <Badge tone="moss" dot>Connected</Badge></div>
              <div className="flex justify-between"><span className="text-faint">Collections</span> <span>24</span></div>
            </div>
          </div>
          <div className="card p-6">
            <h3 className="mb-3 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
              <Cloud size={16} className="text-copper" /> Object storage
            </h3>
            <div className="mb-2 flex justify-between text-[12.5px]">
              <span className="text-faint">{STORAGE.usedGB} GB used of {STORAGE.totalGB} GB</span>
              <span className="font-mono text-[11px] text-faint">{Math.round((STORAGE.usedGB / STORAGE.totalGB) * 100)}%</span>
            </div>
            <Progress value={(STORAGE.usedGB / STORAGE.totalGB) * 100} tone={STORAGE.usedGB / STORAGE.totalGB > 0.85 ? 'copper' : 'wine'} />
            <div className="mt-3 flex justify-between text-[12.5px] text-ink-2">
              <span className="text-faint">Provider</span> <span className="font-mono">S3-compatible (configurable)</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 flex items-center gap-2 font-display text-[15.5px] font-semibold text-ink">
            <Mail size={16} className="text-copper" /> SMTP
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-md text-[12.5px] leading-relaxed text-faint">
              Configured via <span className="font-mono text-[11.5px]">SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD / SMTP_FROM</span>.
              Used for login OTP, password resets and meeting reminders.
            </p>
            <Badge tone="amber" dot>Not configured in this preview</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ title, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line py-4 first:border-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium text-ink">{title}</div>
        {desc && <div className="mt-0.5 text-[12px] leading-relaxed text-faint">{desc}</div>}
      </div>
      {children}
    </div>
  );
}
