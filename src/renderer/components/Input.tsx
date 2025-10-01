import styled from "@emotion/styled";
import type { MarginProps, PaddingProps, SizeProps } from "../styles/util";
import { ApplySize, ApplyPadding, ApplyMargin } from "../styles/util";

const Input = styled.input<SizeProps & PaddingProps & MarginProps>`
  padding: 6px 8px;
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  border-radius: 6px;
  border: 1px solid var(--border, #e5e7eb);
`;

export default Input;
