import styled from "@emotion/styled";
import type { SizeProps, PaddingProps, MarginProps, FlexProps} from "../styles/util";
import { ApplyFlex, ApplySize, ApplyPadding, ApplyMargin } from "../styles/util";


const XStack = styled.div<
  FlexProps &
  SizeProps &
  PaddingProps &
  MarginProps
>`
  display:flex;
  flex-direction: row;
  ${ApplyFlex}
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
`

export default XStack;