import styled from "@emotion/styled";
import type { SizeProps, PaddingProps, MarginProps, FlexProps, RoundedProps} from "../styles/util";
import { ApplyFlex, ApplySize, ApplyPadding, ApplyMargin, ApplyRounded } from "../styles/util";


const XStack = styled.div<
  FlexProps &
  SizeProps &
  PaddingProps &
  MarginProps &
  RoundedProps
>`
  display:flex;
  flex-direction: row;
  ${ApplyFlex}
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
  ${ApplyRounded}
`

export default XStack;