import styled from "@emotion/styled";
import type { SizeProps, PaddingProps, MarginProps, FlexProps, RoundedProps, StyleProps} from "../styles/util";
import { ApplyFlex, ApplySize, ApplyPadding, ApplyMargin, ApplyRounded, ApplyStyle } from "../styles/util";


const YStack = styled.div<
  FlexProps &
  SizeProps &
  PaddingProps &
  MarginProps &
  RoundedProps & 
  StyleProps
>`
  display:flex;
  flex-direction: column;
  ${ApplyFlex}
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  ${ApplyRounded}
  ${ApplyStyle}
`

export default YStack;