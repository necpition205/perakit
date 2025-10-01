import styled from '@emotion/styled';
import type { MarginProps, PaddingProps, SizeProps } from '../styles/util';
import { ApplyMargin, ApplyPadding, ApplySize } from '../styles/util';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const colors: Record<AlertVariant, { bg: string; border: string } > = {
  info: { bg: '#eff6ff', border: '#bfdbfe' },
  success: { bg: '#ecfdf5', border: '#bbf7d0' },
  warning: { bg: '#fffbeb', border: '#fde68a' },
  error: { bg: '#fef2f2', border: '#fecaca' },
};

const Alert = styled.div<{ variant?: AlertVariant } & SizeProps & PaddingProps & MarginProps>`
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid ${({ variant = 'info' }) => colors[variant].border};
  background: ${({ variant = 'info' }) => colors[variant].bg};
`;

export default Alert;

