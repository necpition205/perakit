import styled from "@emotion/styled";
import type { MarginProps, PaddingProps, RoundedProps, SizeProps, StyleProps } from "../styles/util";
import { ApplySize, ApplyPadding, ApplyMargin, ApplyRounded, ApplyStyle } from "../styles/util";

const Select = styled.select<
  SizeProps &
  PaddingProps &
  MarginProps &
  RoundedProps &
  StyleProps
>`
  padding: 6px 8px;
  border-radius: 6px;
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  ${ApplyRounded}
  ${ApplyStyle}
  border: 1px solid ${props => props.theme.colors.outline};
  background: ${props => props.theme.colors.bgWeak};
  color: ${props => props.theme.colors.ctWeak};
  &:focus { outline: none; }
`;

export default Select;
