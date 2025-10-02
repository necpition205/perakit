import styled from "@emotion/styled";
import type { MarginProps, PaddingProps, SizeProps } from "../styles/util";
import { ApplySize, ApplyPadding, ApplyMargin } from "../styles/util";

const Button = styled.button<SizeProps & PaddingProps & MarginProps>`
  padding: 6px 8px;
  border-radius: 6px;
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  border: 1px solid ${props => props.theme.colors.outline};
  cursor: pointer;
  background: ${props => props.theme.colors.bgWeak};
  color: ${props => props.theme.colors.ctWeak};
  &:not(:disabled):hover {
    background: ${props => props.theme.colors.bgRegular};
    color: ${props => props.theme.colors.ctRegular};
  }
  &:disabled { cursor: not-allowed; opacity: 0.6; }
`;

export default Button;
