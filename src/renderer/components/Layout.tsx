import React, { PropsWithChildren, useEffect } from 'react';
import styled from '@emotion/styled';
import { motion } from 'framer-motion';
import Sidebar, { tabs } from './Sidebar';
import { useAppStore } from '../store/app';
import { useMemoryStore } from '../store/memory';

const Root = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
`;

const TopBar = styled(motion.header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border, #e5e7eb);
`;

const Content = styled.section`
  flex: 1;
  overflow: hidden;
`;

export default function Layout({ children }: PropsWithChildren) {
  const activeTab = useAppStore(s => s.activeTab);
  const devices = useAppStore(s => s.devices);
  const selectedDeviceId = useAppStore(s => s.selectedDeviceId);
  const attached = useAppStore(s => s.attached);
  const setTab = useAppStore(s => s.setTab);
  const handleRemoteDetached = useAppStore(s => s.handleRemoteDetached);
  const disposeMemory = useMemoryStore(s => s.dispose);

  const deviceLabel = selectedDeviceId
    ? (devices.find(d => d.id === selectedDeviceId)?.name || selectedDeviceId)
    : 'Local Device';
  const attachedLabel = attached ? (attached.name || (attached.pid != null ? `PID ${attached.pid}` : '')) : '-';

  // Keyboard shortcuts from main: Ctrl/Cmd + [1..9]
  useEffect(() => {
    const unsub = window.api.onGoTab((index) => {
      if (typeof index !== 'number') return;
      const target = tabs[index];
      if (target) setTab(target.key);
    });
    return () => { unsub && unsub(); };
  }, [setTab]);

  useEffect(() => {
    const unsub = window.api.onFridaDetached(({ reason }) => {
      handleRemoteDetached(reason);
      disposeMemory();
    });
    return () => { unsub && unsub(); };
  }, [handleRemoteDetached, disposeMemory]);

  return (
    <Root>
      <Sidebar />
      <Main>
        <TopBar initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
          <strong>{tabs.find(t => t.key === activeTab)?.label}</strong>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 12, opacity: 0.85 }}>
            <span>Device: <b>{deviceLabel}</b></span>
            <span>Attached: <b>{attachedLabel}</b></span>
          </div>
        </TopBar>
        <Content>{children}</Content>
      </Main>
    </Root>
  );
}
