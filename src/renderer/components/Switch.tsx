import React from 'react';
import styled from '@emotion/styled';
import type { MarginProps } from '../styles/util';
import { ApplyMargin } from '../styles/util';

export type SwitchProps = React.InputHTMLAttributes<HTMLInputElement> & MarginProps & {
  label?: React.ReactNode;
};

const Row = styled.label<MarginProps>`
  ${ApplyMargin}
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const Track = styled.span<{ checked?: boolean }>`
  width: 36px; height: 20px;
  border-radius: 999px;
  background: ${({ checked }) => (checked ? 'var(--accent-50, #eef2ff)' : '#e5e7eb')};
  position: relative;
  transition: background 120ms ease;
`;

const Thumb = styled.span<{ checked?: boolean }>`
  position: absolute;
  top: 2px; left: ${({ checked }) => (checked ? '18px' : '2px')};
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; border: 1px solid var(--border, #e5e7eb);
  transition: left 120ms ease;
`;

const Hidden = styled.input`
  position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0;
`;

export default function Switch({ label, checked, defaultChecked, onChange, ...rest }: SwitchProps) {
  const [value, setValue] = React.useState<boolean>(!!defaultChecked);
  const isControlled = typeof checked === 'boolean';
  const current = isControlled ? !!checked : value;

  return (
    <Row>
      <Hidden type="checkbox" checked={current} onChange={(e) => {
        if (!isControlled) setValue(e.target.checked);
        onChange?.(e);
      }} {...rest} />
      <Track checked={current}><Thumb checked={current} /></Track>
      {label && <span>{label}</span>}
    </Row>
  );
}

