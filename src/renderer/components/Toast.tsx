import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { create } from 'zustand';
import { Portal } from './Portal';

type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number; // ms
  expiresAt?: number; // epoch ms used to avoid timer reset when stacking
};

type ToastStore = {
  toasts: Toast[];
  show: (t: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],
  show: (t) => {
    const id = Math.random().toString(36).slice(2);
    const duration = t.duration ?? 3000;
    const toast: Toast = { id, duration, variant: 'info', expiresAt: Date.now() + duration, ...t };
    const MAX = 5;
    const next = [...get().toasts, toast];
    set({ toasts: next.slice(Math.max(0, next.length - MAX)) });
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
  clear: () => set({ toasts: [] }),
}));

export function toast(t: Omit<Toast, 'id'>) {
  return useToastStore.getState().show(t);
}

const Wrap = styled.div`
  position: fixed; top: 12px; right: 12px; z-index: 80;
  display: flex; flex-direction: column; gap: 8px;
`;

const Item = styled.div<{ variant: ToastVariant }>`
  min-width: 240px; max-width: 420px;
  background: #fff; color: inherit;
  border: 1px solid var(--border, #e5e7eb);
  border-left-width: 4px; border-left-color:
    ${({ variant }) => variant === 'success' ? '#16a34a' : variant === 'error' ? '#dc2626' : variant === 'warning' ? '#d97706' : '#3b82f6'};
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
`;

import { AnimatePresence, motion } from 'framer-motion';

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const dismiss = useToastStore(s => s.dismiss);

  useEffect(() => {
    const timers = toasts.map(t => {
      const remaining = Math.max(0, (t.expiresAt ?? (Date.now() + (t.duration ?? 3000))) - Date.now());
      const id = window.setTimeout(() => dismiss(t.id), remaining);
      return () => window.clearTimeout(id);
    });
    return () => { timers.forEach(fn => fn()); };
  }, [toasts, dismiss]);

  if (!toasts.length) return null;
  return (
    <Portal>
      <Wrap>
        <AnimatePresence initial={false}>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              onClick={() => dismiss(t.id)}
              style={{ cursor: 'pointer' }}
            >
              <Item variant={t.variant || 'info'}>
                {t.title && <div style={{ fontWeight: 600 }}>{t.title}</div>}
                {t.description && <div style={{ opacity: 0.8 }}>{t.description}</div>}
              </Item>
            </motion.div>
          ))}
        </AnimatePresence>
      </Wrap>
    </Portal>
  );
}

export default ToastContainer;
