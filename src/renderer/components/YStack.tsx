import styled from "@emotion/styled";
import type { SizeProps, PaddingProps, MarginProps, FlexProps} from "../styles/util";
import { ApplyFlex, ApplySize, ApplyPadding, ApplyMargin } from "../styles/util";


const YStack = styled.div<
  FlexProps &
  SizeProps &
  PaddingProps &
  MarginProps
>`
  display:flex;
  flex-direction: column;
  ${ApplyFlex}
  ${ApplySize}
  ${ApplyPadding}
  ${ApplyMargin}
`

export default YStack;