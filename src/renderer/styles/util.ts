function numberOr(value: number | string) {
  return typeof value == "number" ? `${value}px` : value;
}

export interface SizeProps {
  w?: number | string;
  h?: number | string;
  minW?: number | string;
  minH?: number | string;
  maxW?: number | string;
  maxH?: number | string;
}

export function ApplySize(props: SizeProps) {
  const { w, h, minW, minH, maxW, maxH } = props;
  const styles: Map<string, string> = new Map();
  if (w) styles.set(`width`, numberOr(w));
  if (h) styles.set(`height`, numberOr(h));
  if (minW) styles.set(`min-width`, numberOr(minW));
  if (minH) styles.set(`min-height`, numberOr(minH));
  if (maxW) styles.set(`max-width`, numberOr(maxW));
  if (maxH) styles.set(`max-height`, numberOr(maxH));
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}

export interface RoundedProps {
  r?: number | string;
}

export function ApplyRounded(props: RoundedProps) {
  const styles: Map<string, string> = new Map();
  if (props.r) styles.set(`border-radius`, numberOr(props.r));
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}

export interface PositionProps {
  top?: number | string;
  right?: number | string;
  bottom?: number | string;
  left?: number | string;
}

export function ApplyPosition(props: PositionProps) {
  const styles: Map<string, string> = new Map();
  if (props.top) styles.set(`top`, numberOr(props.top));
  if (props.right) styles.set(`right`, numberOr(props.right));
  if (props.bottom) styles.set(`bottom`, numberOr(props.bottom));
  if (props.left) styles.set(`left`, numberOr(props.left));
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}

export interface PaddingProps {
  p?: number | string;
  pt?: number | string;
  pr?: number | string;
  pb?: number | string;
  pl?: number | string;
  px?: number | string;
  py?: number | string;
}

export function ApplyPadding(props: PaddingProps) {
  const styles: Map<string, string> = new Map();
  if (props.p) styles.set(`padding`, numberOr(props.p));
  if (props.px && props.py) styles.set(`padding`, `${numberOr(props.py)} ${numberOr(props.px)}`);
  else {
    if (props.px) styles.set(`padding`, `0 ${numberOr(props.px)}`);
    if (props.py) styles.set(`padding`, `${numberOr(props.py)} 0`);
  }
  if (props.pt) styles.set( `padding-top`, numberOr(props.pt));
  if (props.pr) styles.set(`padding-right`, numberOr(props.pr));
  if (props.pb) styles.set(`padding-bottom`, numberOr(props.pb));
  if (props.pl) styles.set(`padding-left`, numberOr(props.pl));
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}

export interface MarginProps {
  m?: number | string;
  mt?: number | string;
  mr?: number | string;
  mb?: number | string;
  ml?: number | string;
  mx?: number | string;
  my?: number | string;
}

export function ApplyMargin(props: MarginProps) {
  const styles: Map<string, string> = new Map();
  if (props.m) styles.set(`margin`, numberOr(props.m));
  if (props.mx && props.my) styles.set(`margin`, `${numberOr(props.my)} ${numberOr(props.mx)}`);
  else {
    if (props.mx) styles.set(`margin`, `0 ${numberOr(props.mx)}`);
    if (props.my) styles.set(`margin`, `${numberOr(props.my)} 0`);
  }
  if (props.mt) styles.set( `margin-top`, numberOr(props.mt));
  if (props.mr) styles.set(`margin-right`, numberOr(props.mr));
  if (props.mb) styles.set(`margin-bottom`, numberOr(props.mb));
  if (props.ml) styles.set(`margin-left`, numberOr(props.ml));
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}

export interface StyleProps {
  bg?: string;
  text?: string;
  border?: string;
  bgBlur?: number | string;
}

export function ApplyStyle(props: StyleProps) {
  const styles: Map<string, string> = new Map();
  if (props.bg) styles.set(`background-color`, props.bg);
  if (props.text) styles.set(`color`, props.text);
  if (props.border) styles.set(`border`, `1px solid ${props.border}`);
  if (props.bgBlur) styles.set(`backdrop-filter`, `blur(${numberOr(props.bgBlur)})`);
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}

export interface FlexProps {
  row?: boolean;
  column?: boolean;
  justifyStart?: boolean;
  justifyEnd?: boolean;
  justifyCenter?: boolean;
  justifyBetween?: boolean;
  justifyAround?: boolean;
  justifyEvenly?: boolean;
  alignStart?: boolean;
  alignEnd?: boolean;
  alignCenter?: boolean;
  alignBaseline?: boolean;
  alignStretch?: boolean;
  wrap?: boolean;
  gap?: number | string;
}

export function ApplyFlex(props: FlexProps) {
  const styles: Map<string, string> = new Map();
  if (props.row) styles.set(`display`, `flex`);
  else if (props.column) styles.set(`display`, `flex`);
  if (props.justifyStart) styles.set(`justify-content`, `flex-start`);
  else if (props.justifyEnd) styles.set(`justify-content`, `flex-end`);
  else if (props.justifyCenter) styles.set(`justify-content`, `center`);
  else if (props.justifyBetween) styles.set(`justify-content`, `space-between`);
  else if (props.justifyAround) styles.set(`justify-content`, `space-around`);
  else if (props.justifyEvenly) styles.set(`justify-content`, `space-evenly`);
  if (props.alignStart) styles.set(`align-items`, `flex-start`);
  else if (props.alignEnd) styles.set(`align-items`, `flex-end`);
  else if (props.alignCenter) styles.set(`align-items`, `center`);
  else if (props.alignBaseline) styles.set(`align-items`, `baseline`);
  else if (props.alignStretch) styles.set(`align-items`, `stretch`);
  if (props.wrap) styles.set(`flex-wrap`, `wrap`);
  if (props.gap) styles.set(`gap`, numberOr(props.gap));
  return Array.from(styles.entries()).map(([k, v]) => `${k}: ${v}`).join('; ') + ";";
}