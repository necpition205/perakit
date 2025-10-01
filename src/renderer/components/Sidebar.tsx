import React from 'react';
import styled from '@emotion/styled';
import { useAppStore, TabKey } from '../store/app';
import { AppleIcon, BlocksIcon, CodeIcon, CoffeeIcon, ComponentIcon, MicrochipIcon, MonitorSmartphoneIcon, ScrollTextIcon, SpoolIcon } from 'lucide-react';

const Container = styled.aside`
  width: 60px;
  border-right: 1px solid var(--border, #e5e7eb);
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: auto; /* scroll icons if vertical overflow */
  min-height: 0;
`;

const Item = styled.button<{ active?: boolean }>`
  appearance: none;
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  border: 0;
  background: ${({ active }) => (active ? 'var(--accent-50, #eef2ff)' : 'transparent')};
  color: ${({ active }) => (active ? 'var(--accent-900, #1e293b)' : 'inherit')};
  cursor: pointer;
  &:hover { background: var(--hover, #f3f4f6); }
`;

export const tabs: { key: TabKey; label: string; icon: React.ComponentType }[] = [
  { key: 'attach', label: 'Attach', icon: MonitorSmartphoneIcon },
  { key: 'memory', label: 'Memory', icon: MicrochipIcon },
  { key: 'modules', label: 'Modules', icon: ComponentIcon },
  { key: 'threads', label: 'Threads', icon: SpoolIcon },
  { key: 'java', label: 'Java', icon: CoffeeIcon },
  { key: 'objc', label: 'ObjC', icon: AppleIcon },
  { key: 'code', label: 'Code', icon: CodeIcon },
  { key: 'extension', label: 'Extension', icon: BlocksIcon },
  { key: 'console', label: 'Console', icon: ScrollTextIcon },
];

export function Sidebar() {
  const activeTab = useAppStore(s => s.activeTab);
  const setTab = useAppStore(s => s.setTab);
  return (
    <Container>
      {tabs.map(t => (
        <Item key={t.key} active={activeTab === t.key} onClick={() => setTab(t.key)}>
          <t.icon />
        </Item>
      ))}
    </Container>
  );
}

export default Sidebar;
