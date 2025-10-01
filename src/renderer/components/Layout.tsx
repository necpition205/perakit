import React, { PropsWithChildren } from 'react';
import styled from '@emotion/styled';
import Sidebar, { tabs } from './Sidebar';
import { useAppStore } from '../store/app';

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

const TopBar = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid var(--border, #e5e7eb);
`;

const Content = styled.section`
  flex: 1;
  overflow: hidden;
`;

export default function Layout({ children }: PropsWithChildren) {
  const activeTab = useAppStore(s => s.activeTab);

  return (
    <Root>
      <Sidebar />
      <Main>
        <TopBar>
          <strong>{tabs.find(t => t.key === activeTab)?.label}</strong>
          <span style={{ opacity: 0.7 }}>PeraKit</span>
        </TopBar>
        <Content>{children}</Content>
      </Main>
    </Root>
  );
}
