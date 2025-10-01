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
    const toast: Toast = { id, duration: 3000, variant: 'info', ...t };
    set({ toasts: [...get().toasts, toast] });
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter(t => t.id !== id) }),
  clear: () => set({ toasts: [] }),
}));

export function toast(t: Omit<Toast, 'id'>) {
  return useToastStore.getState().show(t);
}

const Wrap = styled.div`
  position: fixed; top: 12px; right: 12px; z-index: 60;
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

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  const dismiss = useToastStore(s => s.dismiss);

  useEffect(() => {
    const timers = toasts.map(t => {
      const duration = t.duration ?? 3000;
      const id = window.setTimeout(() => dismiss(t.id), duration);
      return () => window.clearTimeout(id);
    });
    return () => { timers.forEach(fn => fn()); };
  }, [toasts, dismiss]);

  if (!toasts.length) return null;
  return (
    <Portal>
      <Wrap>
        {toasts.map(t => (
          <Item key={t.id} variant={t.variant || 'info'}>
            {t.title && <div style={{ fontWeight: 600 }}>{t.title}</div>}
            {t.description && <div style={{ opacity: 0.8 }}>{t.description}</div>}
          </Item>
        ))}
      </Wrap>
    </Portal>
  );
}

export default ToastContainer;

