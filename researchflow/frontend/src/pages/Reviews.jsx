import React, { useState } from 'react';
import { Check, Eye, FileText, MessageSquare, X } from 'lucide-react';
import { useWork } from '../lib/work';
import { useToast } from '../lib/toast';
import { Avatar, Badge, Field, Modal, PageHeader, StatusPill } from '../components/ui';
import { browserNotify } from '../lib/notify';
import { fileSize, fmtDateShort, relTime } from '../lib/utils';

export default function Reviews() {
  const { work, user, actions } = useWork();
  const toast = useToast();
  const [openFor, setOpenFor] = useState(null); // 'open' | 'comment' | 'approve' | 'changes'
  const [doc, setDoc] = useState(null);
  const [feedback, setFeedback] = useState('');

  const queue = work.documents
    .filter((d) => d.review !== 'Approved')
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));

  const act = (mode) => {
    if (!doc) return;
    if (mode === 'open') {
      toast(`Opening ${doc.name} in review mode…`, 'info');
      return;
    }
    if (mode === 'approve') {
      actions.reviewDocument(doc.id, 'Approved', feedback || undefined);
      toast(`Approved ${doc.name}`);
      browserNotify('Document approved', `${doc.name} — approved by you`);
    } else {
      actions.reviewDocument(doc.id, 'Changes Requested', feedback || 'Please address the review comments.');
      toast(`Changes requested on ${doc.name}`);
      browserNotify('Changes requested', `${user(doc.uploader)?.name || 'Researcher'} needs to update ${doc.name}`);
    }
    setDoc(null);
    setOpenFor(null);
    setFeedback('');
  };

  return (
    <div className="mx-auto max-w-[980px]">
      <PageHeader
        title="Research Review Queue"
        sub={`${queue.length} documents awaiting your review · supervisors review, researchers respond`}
      />

      <div className="space-y-4">
        {queue.map((d) => {
          const up = user(d.uploader) || { name: 'You' };
          const comments = work.docComments.filter((c) => c.docId === d.id);
          return (
            <div key={d.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-copper-soft font-mono text-[10px] font-bold text-copper uppercase">
                  {d.type}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-ink">{d.name}</h3>
                    <Badge tone="neutral" className="font-mono text-[10px]">v{d.version}</Badge>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-faint">
                    <span className="flex items-center gap-1.5">
                      <Avatar name={up.name} size={18} /> {up.name}
                    </span>
                    <span>· {d.cat}</span>
                    <span>· {fileSize(d.sizeKB)}</span>
                    <span>· submitted {relTime(d.date)}</span>
                    {comments.length > 0 && <span>· {comments.length} comments</span>}
                  </div>
                  {comments.length > 0 && (
                    <p className="mt-2.5 line-clamp-1 border-l-2 border-gold/50 pl-3 text-[12.5px] text-ink-2 italic">
                      “{comments[comments.length - 1].text}”
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <StatusPill status={d.review} />
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => act('open')} className="btn-ghost px-2.5 py-1.5 text-[12px]"><Eye size={13} /> Open</button>
                    <button
                      onClick={() => { setDoc(d); setOpenFor('comment'); setFeedback(comments.length ? comments[comments.length - 1].text : ''); }}
                      className="btn-ghost px-2.5 py-1.5 text-[12px]"
                    >
                      <MessageSquare size={13} /> Comment
                    </button>
                    <button
                      onClick={() => { setDoc(d); setOpenFor('approve'); setFeedback(''); }}
                      className="btn-soft px-2.5 py-1.5 text-[12px]"
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      onClick={() => { setDoc(d); setOpenFor('changes'); setFeedback('Please verify missing values.'); }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-rust/30 bg-rust/5 px-2.5 py-1.5 text-[12px] font-medium text-rust transition hover:bg-rust/10"
                    >
                      <X size={13} /> Request Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {queue.length === 0 && (
          <div className="card p-12 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-moss/10 text-moss"><Check size={20} /></span>
            <p className="mt-3 font-display text-[15px] font-semibold text-ink">Review queue is clear.</p>
            <p className="mt-1 text-[12.5px] text-faint">New submissions will appear here in real time.</p>
          </div>
        )}
      </div>

      <Modal
        open={!!openFor && openFor !== 'open'}
        onClose={() => { setDoc(null); setOpenFor(null); }}
        title={openFor === 'approve' ? 'Approve document' : openFor === 'changes' ? 'Request changes' : 'Add comment'}
        wide
        footer={
          <>
            <button className="btn-ghost" onClick={() => { setDoc(null); setOpenFor(null); }}>Cancel</button>
            {openFor === 'comment' ? (
              <button className="btn-primary" onClick={() => { if (doc) { actions.addDocComment(doc.id, feedback); toast('Comment added — the uploader is notified'); setDoc(null); setOpenFor(null); } }}>
                <MessageSquare size={14} /> Post Comment
              </button>
            ) : (
              <button className="btn-primary" onClick={() => act(openFor)}>
                {openFor === 'approve' ? <Check size={14} /> : <X size={14} />}
                {openFor === 'approve' ? 'Approve Document' : 'Send Back for Changes'}
              </button>
            )}
          </>
        }
      >
        {doc && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-line bg-card-2/50 px-4 py-3">
              <span className="flex items-center gap-2 text-[13px] text-ink-2">
                <FileText size={14} className="text-copper" /> {doc.name}
              </span>
              <StatusPill status={doc.review} />
            </div>
            <Field
              label={openFor === 'changes' ? 'What needs to change?' : 'Feedback (optional)'}
              hint="The researcher is notified in-app and by email, and can respond in the document comments."
            >
              <textarea className="input min-h-[110px]" value={feedback} onChange={(e) => setFeedback(e.target.value)} autoFocus />
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
