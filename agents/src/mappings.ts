export type MemType =
  | 'ubyte'
  | 'byte'
  | 'ushort'
  | 'short'
  | 'uint'
  | 'int'
  | 'ulong'
  | 'long'
  | 'float'
  | 'double'
  | 'pointer'
  | 'string';

export type Cmp =
  | 'eq'
  | 'gt'
  | 'lt'
  | 'ge'
  | 'le'
  | 'between'
  | 'approx';

const MEM_CODES: Record<Exclude<MemType, 'string'>, number> = {
  ubyte: 1,
  byte: 2,
  ushort: 3,
  short: 4,
  uint: 5,
  int: 6,
  ulong: 7,
  long: 8,
  float: 9,
  double: 10,
  pointer: 11,
};

const CMP_CODES: Record<Cmp, number> = {
  eq: 1,
  gt: 2,
  lt: 3,
  ge: 4,
  le: 5,
  between: 6,
  approx: 7,
};

/**
 * Map a memory type string to its native scan code.
 */
export function typeToCode(type: MemType): number {
  if (type === 'string') return 6;
  return MEM_CODES[type] ?? 6;
}

/**
 * Map a comparison mode string to its native scan code.
 */
export function cmpToCode(cmp: Cmp): number {
  return CMP_CODES[cmp] ?? 1;
}
