import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check, Download, Eye, FilePlus2, FileText, History, MessagesSquare,
  Send, Upload, X,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSession } from '../lib/session';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, EmptyState, Field, Modal, StatusPill } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { absUrl, apiMode } from '../lib/api';
import { cn, fileSize, fmtDate, fmtDateShort, relTime } from '../lib/utils';

const CATS = ['All', 'Research Papers', 'Datasets', 'References', 'Experiment Results', 'Presentations', 'Final Documents'];

export default function Documents({ scope = 'project' }) {
  const { id } = useParams();
  const projectId = scope === 'project' ? id : null;
  const { session } = useSession();
  const { work, user, actions } = useWork();
  const toast = useToast();
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState(null);
  const [comments, setComments] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewChoice, setReviewChoice] = useState('Approved');
  const [reply, setReply] = useState('');
  const fileRef = useRef(null);

  const isSupervisor = ['supervisor', 'admin'].includes(session.role);

  const docs = useMemo(
    () =>
      work.documents
        .filter((d) => (projectId ? d.projectId === projectId : true))
        .filter((d) => cat === 'All' || d.cat === cat)
        .filter((d) => d.name.toLowerCase().includes(q.toLowerCase())),
    [work.documents, projectId, cat, q]
  );

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast('File exceeds the 200 MB limit.', 'err');
      return;
    }
    actions.uploadDocument({
      name: file.name,
      sizeKB: Math.max(1, Math.round(file.size / 1024)),
      cat: cat === 'All' ? 'Research Papers' : cat,
      projectId: projectId || 'p1',
      file,
    });
    toast(`${file.name} uploaded to ${cat === 'All' ? 'Research Papers' : cat}`);
    browserNotify('Document uploaded', `${file.name} is in the research library.`);
    e.target.value = '';
  };

  const download = (doc) => {
    if (apiMode() && doc.path) {
      window.open(absUrl(doc.path), '_blank');
      toast('Download started');
      return;
    }
    const txt = [
      `ResearchFlow — document export (demo file)`,
      `Name: ${doc.name}`, `Version: v${doc.version}`, `Category: ${doc.cat}`,
      `Uploader: ${user(doc.uploader)?.name || 'You'}`, `Size: ${fileSize(doc.sizeKB)}`,
      `Review: ${doc.review}`, ``,
      'This is a placeholder export. In the full-stack phase this downloads the stored object from object storage.',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain' }));
    a.download = doc.name.replace(/\.[^.]+$/, '') + '_v' + doc.version + '.txt';
    a.click();
    toast('Download started');
  };

  const saveReview = () => {
    actions.reviewDocument(review.id, reviewChoice, reviewText || undefined);
    toast(`Document marked as ${reviewChoice}`);
    browserNotify(`Document ${reviewChoice.toLowerCase()}`, review.name);
    setReview(null);
    setReviewText('');
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px] text-faint">
          {docs.length} documents · versioned & reviewable
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="input w-48 py-2 text-[12.5px]"
            placeholder="Search documents…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search documents"
          />
          <label className="btn-primary cursor-pointer py-2 text-[13px]">
            <Upload size={14} /> Upload
            <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
          </label>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {CATS.map((c) => {
          const n = work.documents.filter((d) => (projectId ? d.projectId === projectId : true) && (c === 'All' || d.cat === c)).length;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-[12px] font-medium transition',
                cat === c ? 'border-wine/40 bg-wine-soft text-wine' : 'border-line bg-card text-ink-2 hover:border-line-2'
              )}
            >
              {c} <span className="text-faint">{c === 'All' ? n : n > 0 ? `· ${n}` : ''}</span>
            </button>
          );
        })}
      </div>

      {docs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Your research library is empty."
          desc="Upload papers, datasets, references and results to build the project knowledge base."
          action={
            <label className="btn-primary cursor-pointer">
              <Upload size={15} /> Upload Document
              <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
            </label>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[1fr_130px_150px_80px_90px_150px_120px] gap-3 border-b border-line bg-card-2/60 px-5 py-2.5 text-[10.5px] font-semibold tracking-wider text-faint uppercase lg:grid">
            <span>Document</span><span>Category</span><span>Uploader</span><span>Size</span><span>Updated</span><span>Review status</span><span className="text-right">Actions</span>
          </div>
          {docs.map((doc) => {
            const up = user(doc.uploader) || { name: 'You' };
            return (
              <div
                key={doc.id}
                className="grid grid-cols-1 gap-3 border-b border-line px-5 py-3.5 transition-colors last:border-0 hover:bg-ink/2 lg:grid-cols-[1fr_130px_150px_80px_90px_150px_120px] lg:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wine-soft font-mono text-[9px] font-bold text-wine uppercase">
                    {doc.type}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-medium text-ink">{doc.name}</span>
                      <span className="rounded bg-ink/6 px-1.5 py-px font-mono text-[9.5px] text-faint dark:bg-white/10">v{doc.version}</span>
                    </div>
                    {scope === 'global' && (
                      <div className="mt-0.5 truncate text-[11px] text-faint">{work.projects.find((p) => p.id === doc.projectId)?.title}</div>
                    )}
                  </div>
                </div>
                <div className="text-[12px] text-ink-2">{doc.cat}</div>
                <div className="flex items-center gap-2">
                  <Avatar name={up.name} size={22} />
                  <span className="truncate text-[12px] text-ink-2">{up.name.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                <div className="text-[12px] text-faint">{fileSize(doc.sizeKB)}</div>
                <div className="text-[12px] text-faint">{fmtDateShort(doc.date)}</div>
                <div><StatusPill status={doc.review} /></div>
                <div className="flex items-center gap-1 lg:justify-end">
                  <button onClick={() => setPreview(doc)} className="rounded-md p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink" title="Preview" aria-label={`Preview ${doc.name}`}><Eye size={14.5} /></button>
                  <button onClick={() => setHistory(doc)} className="rounded-md p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink" title="Version history" aria-label={`History of ${doc.name}`}><History size={14.5} /></button>
                  <button onClick={() => { setComments(doc); setReply(''); }} className="rounded-md p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink" title="Comments" aria-label={`Comments on ${doc.name}`}><MessagesSquare size={14.5} /></button>
                  <button onClick={() => download(doc)} className="rounded-md p-1.5 text-faint transition hover:bg-ink/5 hover:text-ink" title="Download" aria-label={`Download ${doc.name}`}><Download size={14.5} /></button>
                  {isSupervisor && (
                    <button
                      onClick={() => { setReview(doc); setReviewChoice(doc.review === 'Approved' ? 'Under Review' : 'Approved'); setReviewText(''); }}
                      className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-copper transition hover:border-copper/50"
                    >
                      Review
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      <Modal open={!!preview} onClose={() => setPreview(null)} title="Document preview" wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPreview(null)}>Close</button>
            <button className="btn-primary" onClick={() => preview && download(preview)}><Download size={14} /> Download</button>
          </>
        }
      >
        {preview && (
          <div>
            <div className="rounded-xl border border-line bg-paper-soft/60 p-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-2.5">
                  <FileText size={16} className="text-wine" />
                  <span className="font-mono text-[12px] text-ink-2">{preview.name}</span>
                </div>
                <Badge tone="neutral">v{preview.version}</Badge>
              </div>
              <div className="mt-4 space-y-2.5">
                {[92, 100, 96, 88, 100, 72, 94, 84, 60].map((w, i) => (
                  <div key={i} className="h-2 rounded-full bg-ink/10" style={{ width: `${w}%` }} />
                ))}
              </div>
              <p className="mt-5 text-[11.5px] leading-relaxed text-faint">
                Inline rendering of {preview.type.toUpperCase()} documents is enabled in the backend phase
                (PDF/DOCX text extraction, image preview). This preview shows the document shell, metadata and versions.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
              {[
                ['Category', preview.cat],
                ['Uploader', user(preview.uploader)?.name || 'You'],
                ['Size', fileSize(preview.sizeKB)],
                ['Updated', fmtDate(preview.date)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-line bg-card-2/50 p-2.5">
                  <div className="text-[10px] tracking-wider text-faint uppercase">{l}</div>
                  <div className="mt-0.5 truncate font-medium text-ink-2">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* History modal */}
      <Modal open={!!history} onClose={() => setHistory(null)} title="Version history" wide>
        {history && (
          <div className="space-y-2.5">
            {[...history.versions].reverse().map((v) => (
              <div key={v.v} className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', v.v === history.version ? 'border-wine/40 bg-wine-soft/40' : 'border-line bg-card-2/40')}>
                <span className="font-mono text-[12px] font-semibold text-wine">v{v.v}</span>
                <span className="text-[12.5px] text-ink-2">{fmtDate(v.date)}</span>
                <span className="text-[12px] text-faint">{fileSize(v.sizeKB)}</span>
                {v.v === history.version ? (
                  <Badge tone="wine" className="ml-auto">Current</Badge>
                ) : (
                  <button
                    onClick={() => { toast(`Restored v${v.v} as the current version`); setHistory(null); }}
                    className="ml-auto text-[11.5px] font-medium text-wine hover:underline"
                  >
                    Restore
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Comments modal */}
      <Modal open={!!comments} onClose={() => setComments(null)} title={`Comments · ${comments?.name || ''}`} wide>
        <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
          {work.docComments.filter((c) => c.docId === comments?.id).map((c) => {
            const u = user(c.userId) || { name: 'You' };
            return (
              <div key={c.id} className="flex gap-3">
                <Avatar name={u.name} size={30} />
                <div className="flex-1 rounded-xl rounded-tl-sm border border-line bg-card-2/50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-ink">{u.name}</span>
                    <span className="text-[10.5px] text-faint">{relTime(c.date)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{c.text}</p>
                </div>
              </div>
            );
          })}
          {work.docComments.filter((c) => c.docId === comments?.id).length === 0 && (
            <p className="py-6 text-center text-[13px] text-faint">No comments yet.</p>
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            className="input flex-1"
            placeholder="Write a comment… (use @name to mention)"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && reply.trim()) {
                actions.addDocComment(comments.id, reply);
                toast('Comment added');
                setReply('');
              }
            }}
          />
          <button
            className="btn-primary px-3"
            disabled={!reply.trim()}
            onClick={() => { actions.addDocComment(comments.id, reply); toast('Comment added'); setReply(''); }}
            aria-label="Send comment"
          >
            <Send size={14} />
          </button>
        </div>
      </Modal>

      {/* Review modal (supervisor) */}
      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={`Review · ${review?.name || ''}`}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => setReview(null)}><X size={14} /> Cancel</button>
            <button className="btn-primary" onClick={saveReview}><Check size={14} /> Save Review</button>
          </>
        }
      >
        {review && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-line bg-card-2/50 px-4 py-3">
              <span className="text-[13px] text-ink-2">Submitted by <strong>{user(review.uploader)?.name || 'You'}</strong> · v{review.version}</span>
              <StatusPill status={review.review} />
            </div>
            <Field label="Review decision">
              <select className="input" value={reviewChoice} onChange={(e) => setReviewChoice(e.target.value)}>
                {['Approved', 'Changes Requested', 'Under Review'].map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Feedback" hint="The researcher is notified in real time and can respond here.">
              <textarea
                className="input min-h-[100px]"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={reviewChoice === 'Changes Requested' ? 'e.g. Please verify the missing values in the age column.' : 'Optional notes for the team…'}
              />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
