import styled from "@emotion/styled";
import type { MarginProps, PaddingProps, SizeProps } from "../styles/util";
import { ApplySize, ApplyPadding, ApplyMargin } from "../styles/util";

const Button = styled.button<SizeProps & PaddingProps & MarginProps>`
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border, #e5e7eb);
  cursor: pointer;
  background: var(--accent-50, #eef2ff);
  color: var(--accent-900, #1e293b);
  &:not(:disabled):hover { background: var(--accent-50, #f3f4f6); }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
`;

export default Button;
