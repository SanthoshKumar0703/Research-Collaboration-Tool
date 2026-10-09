import React from 'react';
import { BarChart3, Download, FileText, FlaskConical, Users } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Badge, PageHeader, Reveal } from '../components/ui';
import { downloadCSV } from '../lib/utils';

export default function Reports() {
  const { work, user, users } = useWork();
  const toast = useToast();

  const reports = [
    {
      icon: BarChart3, title: 'Research Progress Report', desc: 'Milestone and task completion per project, with schedule variance.',
      gen: () => {
        const rows = [['Project', 'Status', 'Progress %', 'Milestones completed', 'Tasks completed', 'Total tasks']];
        work.projects.forEach((p) => {
          const ms = work.milestones.filter((m) => m.projectId === p.id && m.status === 'Completed').length;
          const t = work.tasks.filter((x) => x.projectId === p.id);
          rows.push([p.title, p.status, p.progress, ms, t.filter((x) => x.status === 'completed').length, t.length]);
        });
        return ['research-progress-report.csv', rows];
      },
    },
    {
      icon: FlaskConical, title: 'Experiment Outcomes', desc: 'Every recorded experiment with status, key metrics and conclusions.',
      gen: () => {
        const rows = [['Project', 'Experiment', 'Status', 'Date', 'Metrics', 'Conclusion']];
        work.experiments.forEach((e) => {
          rows.push([
            work.projects.find((p) => p.id === e.projectId)?.title || '', e.title, e.status, e.date,
            e.metrics.map((m) => `${m[0]}=${m[1]}`).join('; '), e.conclusion,
          ]);
        });
        return ['experiment-outcomes.csv', rows];
      },
    },
    {
      icon: Users, title: 'Team Workload', desc: 'Task volume and completion per researcher.',
      gen: () => {
        const rows = [['Researcher', 'Institution', 'Assigned', 'Completed', 'Completion %']];
        users.filter((u) => u.role === 'researcher').forEach((u) => {
          const t = work.tasks.filter((x) => x.assignee === u.id);
          const done = t.filter((x) => x.status === 'completed').length;
          rows.push([u.name, u.institution, t.length, done, t.length ? Math.round((done / t.length) * 100) : 0]);
        });
        return ['team-workload.csv', rows];
      },
    },
    {
      icon: FileText, title: 'Document Activity', desc: 'Library size, versions and review status per project.',
      gen: () => {
        const rows = [['Project', 'Document', 'Category', 'Version', 'Size (KB)', 'Review status', 'Uploader']];
        work.documents.forEach((d) => {
          rows.push([
            work.projects.find((p) => p.id === d.projectId)?.title || '', d.name, d.cat, d.version, d.sizeKB, d.review,
            user(d.uploader)?.name || 'You',
          ]);
        });
        return ['document-activity.csv', rows];
      },
    },
  ];

  return (
    <div className="mx-auto max-w-[980px]">
      <PageHeader title="Reports" sub="Generated live from workspace data · exported as CSV" />
      <div className="grid gap-4 sm:grid-cols-2">
        {reports.map((r, i) => (
          <Reveal key={r.title} delay={i * 0.06}>
            <div className="card flex h-full flex-col p-6 transition-shadow hover:shadow-lift">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-wine-soft text-wine">
                  <r.icon size={19} />
                </span>
                <Badge tone="moss" dot>Live data</Badge>
              </div>
              <h3 className="mt-4 font-display text-[16.5px] font-semibold text-ink">{r.title}</h3>
              <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-faint">{r.desc}</p>
              <button
                className="btn-primary mt-5 w-full"
                onClick={() => {
                  const [name, rows] = r.gen();
                  downloadCSV(name, rows);
                  toast(`${name} generated & downloaded`);
                }}
              >
                <Download size={14} /> Generate & Download CSV
              </button>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
