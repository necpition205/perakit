import React from 'react';
import styled from '@emotion/styled';
import type { MarginProps, PaddingProps, SizeProps } from '../styles/util';
import { ApplyMargin, ApplyPadding, ApplySize } from '../styles/util';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & SizeProps & PaddingProps & MarginProps & {
  fullWidth?: boolean;
};

const SelectBase = styled.select<SizeProps & PaddingProps & MarginProps & { fullWidth?: boolean }>`
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  width: ${({ fullWidth }) => (fullWidth ? '100%' : undefined)};
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border, #e5e7eb);
  background: #fff;
  color: inherit;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #9ca3af 50%), linear-gradient(135deg, #9ca3af 50%, transparent 50%);
  background-position: calc(100% - 18px) calc(1em + 2px), calc(100% - 12px) calc(1em + 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
`;

export default function Select(props: SelectProps) {
  return <SelectBase {...props} />;
}

