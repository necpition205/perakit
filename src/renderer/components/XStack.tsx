import styled from "@emotion/styled";
import type { SizeProps, PaddingProps, MarginProps, FlexProps, RoundedProps, StyleProps} from "../styles/util";
import { ApplyFlex, ApplySize, ApplyPadding, ApplyMargin, ApplyRounded, ApplyStyle } from "../styles/util";


const XStack = styled.div<
  FlexProps &
  SizeProps &
  PaddingProps &
  MarginProps &
  RoundedProps &
  StyleProps
>`
  display:flex;
  flex-direction: row;
  ${ApplyFlex}
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  ${ApplyRounded}
  ${ApplyStyle}
`

export default XStack;