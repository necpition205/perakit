import React from 'react';
import styled from '@emotion/styled';
import type { MarginProps } from '../styles/util';
import { ApplyMargin } from '../styles/util';

export type ToggleProps = React.InputHTMLAttributes<HTMLInputElement> & MarginProps & {
  label?: React.ReactNode;
};

const Row = styled.label<MarginProps>`
  ${ApplyMargin}
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Box = styled.span<{ checked?: boolean }>`
  width: 16px; height: 16px;
  border-radius: 4px;
  border: 1px solid var(--border, #e5e7eb);
  background: ${({ checked }) => (checked ? 'var(--accent-50, #eef2ff)' : '#fff')};
  display: inline-block;
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 2px; left: 2px; right: 2px; bottom: 2px;
    background: ${({ checked }) => (checked ? 'var(--accent-900, #1e293b)' : 'transparent')};
    border-radius: 2px;
  }
`;

const Hidden = styled.input`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0; height: 0;
`;

export default function Toggle({ label, checked, defaultChecked, onChange, ...rest }: ToggleProps) {
  const [value, setValue] = React.useState<boolean>(!!defaultChecked);
  const isControlled = typeof checked === 'boolean';
  const current = isControlled ? !!checked : value;

  return (
    <Row>
      <Hidden type="checkbox" checked={current} onChange={(e) => {
        if (!isControlled) setValue(e.target.checked);
        onChange?.(e);
      }} {...rest} />
      <Box checked={current} />
      {label && <span>{label}</span>}
    </Row>
  );
}

