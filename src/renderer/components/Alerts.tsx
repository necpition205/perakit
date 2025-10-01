import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { create } from 'zustand';
import { Portal } from './Portal';
import { AnimatePresence, motion } from 'framer-motion';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type AlertItem = {
  id: string;
  title?: string;
  description?: string;
  variant?: AlertVariant;
};

type AlertStore = {
  alerts: AlertItem[];
  show: (a: Omit<AlertItem, 'id'>) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: [],
  show: (a) => {
    const id = Math.random().toString(36).slice(2);
    set({ alerts: [...get().alerts, { id, variant: 'error', ...a }] });
    return id;
  },
  dismiss: (id) => set({ alerts: get().alerts.filter(x => x.id !== id) }),
  clear: () => set({ alerts: [] })
}));

export function alert(a: Omit<AlertItem, 'id'>) {
  return useAlertStore.getState().show(a);
}

const Wrap = styled.div`
  position: fixed; top: 56px; right: 12px; z-index: 70;
  display: flex; flex-direction: column; gap: 8px;
`;

const Card = styled.div<{ variant: AlertVariant }>`
  min-width: 260px; max-width: 420px;
  background: #fff; color: inherit;
  border: 1px solid var(--border, #e5e7eb);
  border-left: 4px solid
    ${({ variant }) => variant === 'success' ? '#16a34a' : variant === 'error' ? '#dc2626' : variant === 'warning' ? '#d97706' : '#3b82f6'};
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.15);
  cursor: pointer;
`;

export function AlertsContainer() {
  const alerts = useAlertStore(s => s.alerts);
  const dismiss = useAlertStore(s => s.dismiss);

  return (
    <Portal>
      <Wrap>
        <AnimatePresence initial={false}>
          {alerts.map(a => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              onClick={() => dismiss(a.id)}
            >
              <Card variant={a.variant || 'error'}>
                {a.title && <div style={{ fontWeight: 600 }}>{a.title}</div>}
                {a.description && <div style={{ opacity: 0.85 }}>{a.description}</div>}
                {!a.title && !a.description && <div>Error</div>}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </Wrap>
    </Portal>
  );
}

export default AlertsContainer;

