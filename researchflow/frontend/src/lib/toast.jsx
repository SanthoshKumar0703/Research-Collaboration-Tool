import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { uid } from './utils';

const Ctx = createContext(() => {});

const ICONS = {
  ok: <CheckCircle2 size={16} className="text-moss shrink-0" />,
  err: <AlertCircle size={16} className="text-rust shrink-0" />,
  info: <Info size={16} className="text-copper shrink-0" />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  /** push(msg, kind, opts?) — opts: { onClick, title, duration } */
  const push = useCallback((msg, kind = 'ok', opts = {}) => {
    const id = uid();
    const toastItem = { id, msg, kind, title: opts.title, onClick: opts.onClick };
    setToasts((t) => [...t.slice(-3), toastItem]);
    setTimeout(() => dismiss(id), opts.duration ?? 4200);
    return id;
  }, [dismiss]);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex w-[min(92vw,380px)] flex-col gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                if (t.onClick) {
                  t.onClick();
                  dismiss(t.id);
                }
              }}
              className={`card flex items-start gap-2.5 px-4 py-3 shadow-lift ${t.onClick ? 'cursor-pointer hover:border-line-2' : ''}`}
            >
              {ICONS[t.kind]}
              <div className="min-w-0 flex-1">
                {t.title && <div className="text-[13px] font-semibold text-ink">{t.title}</div>}
                <div className="text-sm text-ink-2">{t.msg}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                aria-label="Dismiss notification"
                className="shrink-0 rounded p-0.5 text-faint transition hover:bg-ink/5 hover:text-ink-2"
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
