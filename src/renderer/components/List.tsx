import React from 'react';
import styled from '@emotion/styled';
import type { MarginProps, PaddingProps, SizeProps } from '../styles/util';
import { ApplyMargin, ApplyPadding, ApplySize } from '../styles/util';

export const List = styled.ul<SizeProps & PaddingProps & MarginProps>`
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  margin: 0;
  padding: 8px 0;
  list-style: none;
`;

export const ListItem = styled.li<{ active?: boolean } & SizeProps & PaddingProps & MarginProps>`
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 6px;
  cursor: pointer;
  background: ${({ active }) => (active ? 'var(--accent-50, #eef2ff)' : 'transparent')};
  &:hover { background: var(--hover, #f3f4f6); }
`;

export const ListDivider = styled.hr`
  border: 0;
  border-top: 1px solid var(--border, #e5e7eb);
  margin: 8px 0;
`;

export const ListSection = styled.div`
  padding: 8px 10px;
  font-weight: 600;
  opacity: 0.7;
`;

export type ListEmptyProps = { label?: string };
export function ListEmpty({ label = 'No items' }: ListEmptyProps) {
  return (
    <div style={{ padding: '12px 10px', opacity: 0.6 }}>{label}</div>
  );
}

