import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as M from './mock';
import { uid } from './utils';
import { browserNotify } from './notify';
import { api, apiMode, hasApi, getToken, wsUrl } from './api';
import { useSession } from './session';
import { useToast } from './toast';

const Ctx = createContext(null);

/** Where a click on a live notification toast/bell item should navigate. */
const NOTIF_ROUTE = {
  task: '/app/tasks',
  deadline: '/app/tasks',
  doc: '/app/documents',
  review: '/app/documents',
  comment: '/app/discussions',
  discussion: '/app/discussions',
  meeting: '/app/meetings',
  experiment: '/app/experiments',
  finding: '/app/findings',
  system: '/app/notifications',
};

const initialWork = () => ({
  projects: M.PROJECTS,
  milestones: M.MILESTONES,
  tasks: M.TASKS,
  documents: M.DOCUMENTS,
  docComments: M.DOC_COMMENTS,
  experiments: M.EXPERIMENTS,
  findings: M.FINDINGS,
  discussions: M.DISCUSSIONS,
  meetings: M.MEETINGS,
  notifications: M.NOTIFICATIONS,
  activity: M.ACTIVITY,
  chats: M.CHAT_SEED,
});

export function WorkProvider({ children }) {
  const { session } = useSession();
  const toast = useToast();
  const nav = useNavigate();
  // API mode activates once VITE_API_URL is set AND the user is signed in.
  const live = hasApi() && !!getToken() && !!session;
  const [mode, setMode] = useState(live ? 'api' : 'demo');
  const [ready, setReady] = useState(false);
  const [work, setWork] = useState(initialWork);
  const [users, setUsers] = useState(M.USERS);
  const [meId, setMeId] = useState('me');
  const bootRef = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++bootRef.current;
    const b = await api('/api/projects/bootstrap');
    if (id !== bootRef.current) return; // superseded
    setWork({ ...b.data, analytics: b.analytics || {}, globalAnalytics: b.globalAnalytics || null });
    setUsers(b.users || []);
    setMeId(b.me);
  }, []);

  useEffect(() => {
    if (!live) {
      bootRef.current++;
      setMode('demo');
      setWork(initialWork());
      setUsers(M.USERS);
      setMeId('me');
      setReady(true);
      return;
    }
    setMode('api');
    setReady(false);
    bootRef.current++;
    const id = bootRef.current;
    api('/api/projects/bootstrap')
      .then((b) => {
        if (id !== bootRef.current) return;
        setWork({ ...b.data, analytics: b.analytics || {}, globalAnalytics: b.globalAnalytics || null });
        setUsers(b.users || []);
        setMeId(b.me);
      })
      .catch((e) => {
        if (id !== bootRef.current) return;
        toast(e.message || 'Could not load your workspace from the server.', 'err');
      })
      .finally(() => {
        if (id === bootRef.current) setReady(true);
      });
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time notifications: joins the user's personal room over
  // /ws/notifications and merges each event into `work.notifications` the
  // instant the server publishes it — no manual refresh needed. Also
  // surfaces a clickable toast + OS-level browser notification.
  useEffect(() => {
    if (!live) return;
    const url = wsUrl(`/ws/notifications?token=${encodeURIComponent(getToken() || '')}`);
    if (!url) return;
    let ws = null;
    let closed = false;
    const connect = () => {
      try {
        ws = new WebSocket(url);
      } catch {
        return;
      }
      ws.onclose = () => {
        if (!closed) setTimeout(connect, 3000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type !== 'notification') return;
          const n = msg.data;
          setWork((w) => (w.notifications.some((x) => x.id === n._id || x.id === n.id) ? w : {
            ...w,
            notifications: [{ ...n, id: n._id || n.id }, ...w.notifications],
          }));
          browserNotify(n.title, n.body);
          toast(n.body, 'info', {
            title: n.title,
            onClick: () => nav(NOTIF_ROUTE[n.type] || '/app/notifications'),
          });
        } catch {}
      };
    };
    connect();
    return () => {
      closed = true;
      ws?.close();
    };
  }, [live]); // eslint-disable-line react-hooks/exhaustive-deps

  const up = (fn) => setWork((prev) => fn(prev));

  const pushActivity = (w, { userId, verb, noun, projectId }) => ({
    ...w,
    activity: [{ id: uid(), userId, verb, noun, projectId: projectId || '', time: new Date().toISOString() }, ...w.activity],
  });

  const pushNotif = (w, { type, title, body, notify = true }) => {
    if (notify) browserNotify(title, body);
    return {
      ...w,
      notifications: [{ id: uid(), type, title, body, time: new Date().toISOString(), read: false }, ...w.notifications],
    };
  };

  /* Runs a demo mutation (demo mode) or an API mutation + silent re-sync
     (API mode). API errors are surfaced as toasts, never crashes. */
  const run = async (demoFn, apiFn) => {
    if (mode === 'demo') return demoFn();
    try {
      await apiFn();
      await refresh();
    } catch (e) {
      toast(e.message || 'That action failed.', 'err');
    }
  };

  const me = (w, id) => (id && w.projects.find((p) => p.id === id)) || null;

  const actions = {
    moveTask(id, status) {
      return run(
        () => {
          up((w) => {
            const task = w.tasks.find((t) => t.id === id);
            if (!task) return w;
            let ws = { ...w, tasks: w.tasks.map((t) => (t.id === id ? { ...t, status } : t)) };
            ws = pushActivity(ws, { userId: 'me', verb: `moved “${task.title}” to`, noun: M.STATUS_LABEL[status], projectId: task.projectId });
            ws = pushNotif(ws, { type: 'task', title: 'Task updated', body: `“${task.title}” moved to ${M.STATUS_LABEL[status]}.` });
            return ws;
          });
        },
        async () => {
          await api(`/api/tasks/${id}`, { method: 'PATCH', body: { status } });
        }
      );
    },
    addTask(data) {
      return run(
        () => {
          up((w) => {
            const task = { id: uid(), projectId: data.projectId, comments: 0, attachments: 0, ...data };
            let ws = { ...w, tasks: [task, ...w.tasks] };
            ws = pushActivity(ws, { userId: 'me', verb: 'created task', noun: task.title, projectId: task.projectId });
            const assignee = users.find((u) => u.id === data.assignee);
            ws = pushNotif(ws, {
              type: 'task',
              title: 'Task assigned',
              body: `“${task.title}” assigned to ${assignee ? assignee.name : 'team'}.`,
            });
            return ws;
          });
        },
        async () => {
          await api('/api/tasks', { method: 'POST', body: data });
        }
      );
    },
    addProject(data) {
      return run(
        () => {
          up((w) => {
            const project = {
              id: uid(),
              desc: '',
              objective: '',
              methodology: '',
              status: 'Planning',
              priority: 'Medium',
              tags: [],
              progress: 0,
              members: ['me'],
              ...data,
            };
            let ws = { ...w, projects: [project, ...w.projects] };
            ws = pushActivity(ws, { userId: 'me', verb: 'created project', noun: project.title, projectId: project.id });
            return ws;
          });
        },
        async () => {
          await api('/api/projects', { method: 'POST', body: data });
        }
      );
    },
    uploadDocument({ name, sizeKB, cat, projectId, file }) {
      return run(
        () => {
          up((w) => {
            const doc = {
              id: uid(), projectId, name, cat, uploader: 'me', version: 1, sizeKB,
              type: (name.split('.').pop() || 'file').toLowerCase(),
              date: new Date().toISOString(), review: 'Pending Review',
              versions: [{ v: 1, date: new Date().toISOString().slice(0, 10), sizeKB }],
            };
            let ws = { ...w, documents: [doc, ...w.documents] };
            ws = pushActivity(ws, { userId: 'me', verb: 'uploaded', noun: name, projectId });
            ws = pushNotif(ws, { type: 'doc', title: 'Document uploaded', body: `${name} was added to ${cat}.` });
            return ws;
          });
        },
        async () => {
          if (!file) throw new Error('No file selected.');
          const fd = new FormData();
          fd.append('file', file);
          fd.append('cat', cat);
          await api(`/api/projects/${projectId}/documents`, { method: 'POST', form: fd });
        }
      );
    },
    reviewDocument(id, review, feedback) {
      return run(
        () => {
          up((w) => {
            const doc = w.documents.find((x) => x.id === id);
            if (!doc) return w;
            let ws = { ...w, documents: w.documents.map((x) => (x.id === id ? { ...x, review } : x)) };
            if (feedback) {
              ws = { ...ws, docComments: [...ws.docComments, { id: uid(), docId: id, userId: 'me', text: feedback, date: new Date().toISOString() }] };
            }
            ws = pushActivity(ws, { userId: 'me', verb: `${review.toLowerCase()} document`, noun: doc.name, projectId: doc.projectId });
            ws = pushNotif(ws, { type: 'review', title: `Document ${review === 'Approved' ? 'approved' : review === 'Changes Requested' ? 'sent back' : 'updated'}`, body: `${doc.name} — ${review}.` });
            return ws;
          });
        },
        async () => {
          await api(`/api/documents/${id}/review`, { method: 'POST', body: { review, feedback } });
        }
      );
    },
    addDocComment(docId, text) {
      return run(
        () => {
          up((w) => {
            let ws = { ...w, docComments: [...w.docComments, { id: uid(), docId, userId: 'me', text, date: new Date().toISOString() }] };
            const doc = w.documents.find((x) => x.id === docId);
            ws = pushActivity(ws, { userId: 'me', verb: 'commented on', noun: doc ? doc.name : '', projectId: doc ? doc.projectId : '' });
            return ws;
          });
        },
        async () => {
          await api(`/api/documents/${docId}/comments`, { method: 'POST', body: { text } });
        }
      );
    },
    addExperiment(data) {
      return run(
        () => {
          up((w) => {
            const exp = { id: uid(), metrics: [], conclusion: '', ...data };
            let ws = { ...w, experiments: [exp, ...w.experiments] };
            ws = pushActivity(ws, { userId: 'me', verb: 'recorded experiment', noun: exp.title, projectId: exp.projectId });
            ws = pushNotif(ws, { type: 'experiment', title: 'Experiment recorded', body: `${exp.title} (${exp.status}).` });
            return ws;
          });
        },
        async () => {
          await api(`/api/projects/${data.projectId}/experiments`, { method: 'POST', body: data });
        }
      );
    },
    addFinding(data) {
      return run(
        () => {
          up((w) => {
            const f = { id: uid(), by: 'me', date: new Date().toISOString(), files: [], ...data };
            let ws = { ...w, findings: [f, ...w.findings] };
            ws = pushActivity(ws, { userId: 'me', verb: 'added finding', noun: f.title, projectId: f.projectId });
            ws = pushNotif(ws, { type: 'finding', title: 'New finding added', body: f.title });
            return ws;
          });
        },
        async () => {
          await api(`/api/projects/${data.projectId}/findings`, { method: 'POST', body: data });
        }
      );
    },
    addThread(data) {
      return run(
        () => {
          up((w) => {
            const th = { id: uid(), by: 'me', date: new Date().toISOString(), pinned: false, resolved: false, replies: [], ...data };
            return { ...w, discussions: [th, ...w.discussions] };
          });
        },
        async () => {
          await api(`/api/projects/${data.projectId}/discussions`, { method: 'POST', body: { title: data.title, body: data.body } });
        }
      );
    },
    addReply(threadId, body) {
      return run(
        () => {
          up((w) => {
            const discussions = w.discussions.map((th) =>
              th.id === threadId
                ? { ...th, replies: [...th.replies, { id: uid(), by: 'me', body, date: new Date().toISOString(), reactions: {} }] }
                : th
            );
            return { ...w, discussions };
          });
        },
        async () => {
          await api(`/api/discussions/${threadId}/replies`, { method: 'POST', body: { body } });
        }
      );
    },
    toggleReaction(threadId, replyId, emoji) {
      if (mode === 'api') {
        api(`/api/discussions/${threadId}/replies/${replyId}/react`, { method: 'POST', body: { emoji } })
          .then(refresh)
          .catch((e) => toast(e.message || 'That action failed.', 'err'));
        // optimistic local update for instant feedback
        up((w) => ({
          ...w,
          discussions: w.discussions.map((th) =>
            th.id !== threadId
              ? th
              : {
                  ...th,
                  replies: th.replies.map((r) => {
                    if (r.id !== replyId) return r;
                    const count = (r.reactions[emoji] || 0) + (r.mine && r.mine[emoji] ? -1 : 1);
                    return {
                      ...r,
                      mine: { ...(r.mine || {}), [emoji]: !r.mine || !r.mine[emoji] ? true : false },
                      reactions: { ...r.reactions, [emoji]: Math.max(0, count) },
                    };
                  }),
                }
          ),
        }));
        return;
      }
      up((w) => ({
        ...w,
        discussions: w.discussions.map((th) =>
          th.id !== threadId
            ? th
            : {
                ...th,
                replies: th.replies.map((r) => {
                  if (r.id !== replyId) return r;
                  const count = (r.reactions[emoji] || 0) + (r.mine && r.mine[emoji] ? -1 : 1);
                  return {
                    ...r,
                    mine: { ...(r.mine || {}), [emoji]: !r.mine || !r.mine[emoji] ? true : false },
                    reactions: { ...r.reactions, [emoji]: Math.max(0, count) },
                  };
                }),
              }
        ),
      }));
    },
    toggleThreadFlag(threadId, flag) {
      if (mode === 'api') {
        const th = work.discussions.find((x) => x.id === threadId);
        api(`/api/discussions/${threadId}`, { method: 'PATCH', body: { [flag]: !th?.[flag] } })
          .then(refresh)
          .catch((e) => toast(e.message || 'That action failed.', 'err'));
      }
      up((w) => ({
        ...w,
        discussions: w.discussions.map((th) => (th.id === threadId ? { ...th, [flag]: !th[flag] } : th)),
      }));
    },
    scheduleMeeting(data) {
      return run(
        () => {
          up((w) => {
            const mtg = { id: uid(), status: 'scheduled', notes: '', actions: [], link: `https://meet.researchflow.app/${uid()}`, ...data };
            let ws = { ...w, meetings: [mtg, ...w.meetings] };
            ws = pushActivity(ws, { userId: 'me', verb: 'scheduled meeting', noun: mtg.title, projectId: mtg.projectId });
            ws = pushNotif(ws, { type: 'meeting', title: 'Meeting scheduled', body: `${mtg.title} — ${new Date(mtg.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at ${mtg.time}.` });
            return ws;
          });
        },
        async () => {
          await api(`/api/projects/${data.projectId}/meetings`, { method: 'POST', body: data });
        }
      );
    },
    saveMeetingNotes(id, notes, actionsList) {
      return run(
        () => {
          up((w) => ({
            ...w,
            meetings: w.meetings.map((m) => (m.id === id ? { ...m, status: 'completed', notes, actions: actionsList || m.actions } : m)),
          }));
        },
        async () => {
          await api(`/api/meetings/${id}`, { method: 'PATCH', body: { notes, actions: actionsList } });
        }
      );
    },
    sendMessage(projectId, text, file = null) {
      if (mode === 'api') {
        // Backend expects multipart form (text + optional file attachment).
        const fd = new FormData();
        fd.append('text', text || '');
        if (file) fd.append('file', file);
        api(`/api/projects/${projectId}/messages`, { method: 'POST', form: fd })
          .then((doc) => appendChat(doc))
          .catch((e) => toast(e.message || 'Message failed to send.', 'err'));
        return;
      }
      up((w) => ({
        ...w,
        chats: [...w.chats, { id: uid(), projectId, userId: 'me', text, date: new Date().toISOString(), file }],
      }));
    },
    receiveMessage(projectId, userId, text) {
      up((w) => ({
        ...w,
        chats: [...w.chats, { id: uid(), projectId, userId, text, date: new Date().toISOString(), file: null }],
      }));
    },
    markRead(id) {
      if (mode === 'api') {
        api(`/api/notifications/${id}/read`, { method: 'POST' })
          .then(refresh)
          .catch(() => {});
      }
      up((w) => ({ ...w, notifications: w.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    },
    markAllRead() {
      if (mode === 'api') {
        api('/api/notifications/read-all', { method: 'POST' })
          .then(refresh)
          .catch(() => {});
      }
      up((w) => ({ ...w, notifications: w.notifications.map((n) => ({ ...n, read: true })) }));
    },
  };

  const appendChat = (doc) => up((w) => ({ ...w, chats: [...w.chats, doc] }));

  const value = {
    work,
    actions,
    users,
    user: (id) => (id === 'me' ? null : users.find((u) => u.id === id)) || null,
    project: (id) => work.projects.find((p) => p.id === id) || null,
    meId,
    mode,
    ready,
    refresh,
    appendChat,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useWork = () => useContext(Ctx);
