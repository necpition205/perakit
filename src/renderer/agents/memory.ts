// Frida agent source for memory scanning and access
// Rewritten to follow latest frida JavaScript API and NativePointer read/write methods.
// Ready for frida-compile devlib modularization.
const MEMORY_AGENT_SOURCE = String.raw`
// --- memory/ranges ---
function listRanges(protections) {
  const want = (protections && protections.length ? protections : ['rw-', 'rwx', 'r--', 'r-x']);
  const seen = new Set();
  const out = [];
  for (const prot of want) {
    try {
      const ranges = Process.enumerateRangesSync({ protection: prot, coalesce: true });
      for (const r of ranges) {
        const key = r.base.toString() + ':' + r.size.toString();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ base: r.base.toString(), size: Number(r.size), protection: r.protection, file: r.file ? { path: r.file.path } : null });
      }
    } catch (_) {}
  }
  return out;
}

// --- memory/read-write helpers (NativePointer API) ---
function np(addrStr) { return ptr(addrStr); }

function readBytes(addrStr, size) {
  const p = np(addrStr);
  const buf = p.readByteArray(size);
  if (!buf) return [];
  const u8 = new Uint8Array(buf);
  const out = new Array(u8.length);
  for (let i = 0; i < u8.length; i++) out[i] = u8[i];
  return out;
}

function writeBytes(addrStr, bytes) {
  const p = np(addrStr);
  const arr = (bytes instanceof ArrayBuffer) ? new Uint8Array(bytes) : new Uint8Array(bytes);
  p.writeByteArray(arr);
  return true;
}

function readTyped(addrStr, type) {
  const p = np(addrStr);
  switch (type) {
    case 'ubyte': return p.readU8();
    case 'byte': return p.readS8();
    case 'ushort': return p.readU16();
    case 'short': return p.readS16();
    case 'uint': return p.readU32();
    case 'int': return p.readS32();
    case 'ulong': return Number(p.readU64());
    case 'long': return Number(p.readS64());
    case 'float': return p.readFloat();
    case 'double': return p.readDouble();
    case 'pointer': return p.readPointer().toString();
    case 'string': return p.readUtf8String() || '';
    default: return null;
  }
}

function writeTyped(addrStr, type, value) {
  const p = np(addrStr);
  switch (type) {
    case 'ubyte': p.writeU8(value >>> 0); break;
    case 'byte': p.writeS8(value | 0); break;
    case 'ushort': p.writeU16(value >>> 0); break;
    case 'short': p.writeS16(value | 0); break;
    case 'uint': p.writeU32(value >>> 0); break;
    case 'int': p.writeS32(value | 0); break;
    case 'ulong': p.writeU64(new UInt64(String(value))); break;
    case 'long': p.writeS64(new Int64(String(value))); break;
    case 'float': p.writeFloat(Number(value)); break;
    case 'double': p.writeDouble(Number(value)); break;
    case 'pointer': p.writePointer(ptr(String(value))); break;
    case 'string': p.writeUtf8String(String(value)); break;
    default: return false;
  }
  return true;
}

// --- native CModule scanner ---
const NATIVE_SCAN_SRC = [
  '#include <stdint.h>',
  '#include <stddef.h>',
  '#include <math.h>',
  '#include <string.h>',
  '',
  'enum ScanType { T_UBYTE=1, T_BYTE, T_USHORT, T_SHORT, T_UINT, T_INT, T_ULONG, T_LONG, T_FLOAT, T_DOUBLE, T_POINTER };',
  'enum CmpOp { CMP_EQ=1, CMP_GT, CMP_LT, CMP_GE, CMP_LE, CMP_BETWEEN, CMP_APPROX };',
  '',
  'static double round_dec(double x, int decimals) {',
  '  if (decimals <= 0) return floor(x + 0.5);',
  '  double f = 1.0; for (int i=0;i<decimals;i++) f *= 10.0;',
  '  return floor(x * f + 0.5) / f;',
  '}',
  '',
  'static int test_number_double(double n, int cmp, double v1, double v2, int decimals, double tol) {',
  '  switch (cmp) {',
  '    case CMP_EQ: return n == v1;',
  '    case CMP_GT: return n > v1;',
  '    case CMP_LT: return n < v1;',
  '    case CMP_GE: return n >= v1;',
  '    case CMP_LE: return n <= v1;',
  '    case CMP_BETWEEN: return (n >= (v1 < v2 ? v1 : v2)) && (n <= (v1 > v2 ? v1 : v2));',
  '    case CMP_APPROX: {',
  '      if (tol > 0.0) return fabs(n - v1) <= tol;',
  '      return round_dec(n, decimals) == v1;',
  '    }',
  '    default: return 0;',
  '  }',
  '}',
  '',
  'static uint64_t scan_block_num(const uint8_t* base, uint64_t len,',
  '  int type, int cmp, double v1, double v2, int decimals, double tol,',
  '  void** out, uint64_t out_cap, int ptr_size)',
  '{',
  '  uint64_t hits = 0;',
  '  uint64_t step = 1;',
  '  for (uint64_t off = 0; off < len; ) {',
  '    double n = 0.0;',
  '    switch (type) {',
  '      case T_UBYTE: step = 1; n = (double) base[off]; break;',
  '      case T_BYTE: step = 1; n = (double) (int8_t) base[off]; break;',
  '      case T_USHORT: step = 2; if (off + 2 <= len) { uint16_t x; memcpy(&x, base+off, 2); n = (double) x; } break;',
  '      case T_SHORT: step = 2; if (off + 2 <= len) { int16_t x; memcpy(&x, base+off, 2); n = (double) x; } break;',
  '      case T_UINT: step = 4; if (off + 4 <= len) { uint32_t x; memcpy(&x, base+off, 4); n = (double) x; } break;',
  '      case T_INT: step = 4; if (off + 4 <= len) { int32_t x; memcpy(&x, base+off, 4); n = (double) x; } break;',
  '      case T_ULONG: step = 8; if (off + 8 <= len) { uint64_t x; memcpy(&x, base+off, 8); n = (double) x; } break;',
  '      case T_LONG: step = 8; if (off + 8 <= len) { int64_t x; memcpy(&x, base+off, 8); n = (double) x; } break;',
  '      case T_FLOAT: step = 4; if (off + 4 <= len) { float x; memcpy(&x, base+off, 4); n = (double) x; } break;',
  '      case T_DOUBLE: step = 8; if (off + 8 <= len) { double x; memcpy(&x, base+off, 8); n = x; } break;',
  '      case T_POINTER: step = (uint64_t) ptr_size; if (off + step <= len) {',
  '        if (ptr_size == 8) { uint64_t x; memcpy(&x, base+off, 8); n = (double) x; }',
  '        else { uint32_t x; memcpy(&x, base+off, 4); n = (double) x; }',
  '      } break;',
  '      default: step = 1; break;',
  '    }',
  '    if (off + step > len) break;',
  '    if (test_number_double(n, cmp, v1, v2, decimals, tol)) {',
  '      if (hits < out_cap) out[hits] = (void*)(base + off);',
  '      hits++;',
  '      if (hits >= out_cap) return hits;',
  '    }',
  '    off += step;',
  '  }',
  '  return hits;',
  '}',
  '',
  'static uint64_t scan_block_str(const uint8_t* base, uint64_t len,',
  '  const uint8_t* pat, uint64_t pat_len, void** out, uint64_t out_cap)',
  '{',
  '  if (pat_len == 0) return 0;',
  '  uint64_t hits = 0;',
  '  for (uint64_t i = 0; i + pat_len <= len; i++) {',
  '    if (memcmp(base + i, pat, pat_len) == 0) {',
  '      if (hits < out_cap) out[hits] = (void*)(base + i);',
  '      hits++;',
  '      if (hits >= out_cap) return hits;',
  '    }',
  '  }',
  '  return hits;',
  '}',
  '',
  '// Exports',
  'void* scan_block_num_export = (void*) &scan_block_num;',
  'void* scan_block_str_export = (void*) &scan_block_str;',
].join('\n');

let nativeScan = null;
function ensureNative() {
  if (nativeScan) return nativeScan;
  const mod = new CModule(NATIVE_SCAN_SRC);
  const numPtr = mod.scan_block_num_export;
  const strPtr = mod.scan_block_str_export;
  nativeScan = {
    num: new NativeFunction(numPtr, 'uint64', ['pointer','uint64','int','int','double','double','int','double','pointer','uint64','int']),
    str: new NativeFunction(strPtr, 'uint64', ['pointer','uint64','pointer','uint64','pointer','uint64'])
  };
  return nativeScan;
}

function typeToCode(type) {
  switch (type) {
    case 'ubyte': return 1; case 'byte': return 2; case 'ushort': return 3; case 'short': return 4;
    case 'uint': return 5; case 'int': return 6; case 'ulong': return 7; case 'long': return 8;
    case 'float': return 9; case 'double': return 10; case 'pointer': return 11; default: return 6;
  }
}
function cmpToCode(cmp) {
  switch (cmp) {
    case 'eq': return 1; case 'gt': return 2; case 'lt': return 3; case 'ge': return 4; case 'le': return 5; case 'between': return 6; case 'approx': return 7; default: return 1;
  }
}

// --- scanning ---
function scan(opts) {
  const protections = (opts && opts.protections) || ['rw-', 'rwx'];
  const type = opts.type || 'int';
  const cmp = opts.cmp || 'eq';
  const value = opts.value;
  const value2 = opts.value2;
  const decimals = typeof opts.decimals === 'number' ? opts.decimals : 1;
  const tolerance = typeof opts.tolerance === 'number' ? opts.tolerance : 0;
  const maxHits = typeof opts.limit === 'number' ? opts.limit : 5000;

  const ranges = listRanges(protections);
  const hits = [];
  const { num, str } = ensureNative();

  function push(addr) {
    hits.push(addr.toString());
    return hits.length >= maxHits;
  }

  function testNumber(n) {
    switch (cmp) {
      case 'eq': return n === value;
      case 'gt': return n > value;
      case 'lt': return n < value;
      case 'ge': return n >= value;
      case 'le': return n <= value;
      case 'between': return n >= Math.min(value, value2) && n <= Math.max(value, value2);
      case 'approx': {
        if (tolerance > 0) return Math.abs(n - value) <= tolerance;
        const factor = Math.pow(10, decimals);
        return Math.round(n * factor) / factor === value;
      }
      default: return false;
    }
  }

  for (const r of ranges) {
    try {
      const cur = ptr(r.base);
      const size = r.size >>> 0;
      const remaining = size >>> 0;
      const cap = Math.min(maxHits - hits.length, 100000);
      const outBuf = Memory.alloc(cap * Process.pointerSize);
      if (type === 'string') {
        const patStr = String(value || '');
        if (!patStr) continue;
        const patMem = Memory.alloc(patStr.length);
        const u8 = new Uint8Array(patStr.length);
        for (let i = 0; i < patStr.length; i++) u8[i] = patStr.charCodeAt(i) & 0xff;
        patMem.writeByteArray(u8);
        const found = Number(str(cur, remaining, patMem, patStr.length >>> 0, outBuf, cap >>> 0));
        for (let i = 0; i < found; i++) {
          const addr = outBuf.add(i * Process.pointerSize).readPointer();
          if (push(addr)) return hits;
        }
      } else {
        const found = Number(num(cur, remaining, typeToCode(type), cmpToCode(cmp), Number(value || 0), Number(value2 || 0), decimals | 0, Number(tolerance || 0), outBuf, cap >>> 0, Process.pointerSize));
        for (let i = 0; i < found; i++) {
          const addr = outBuf.add(i * Process.pointerSize).readPointer();
          if (push(addr)) return hits;
        }
      }
    } catch (_) {}
  }
  return hits;
}

// --- rpc exports ---
rpc.exports = {
  mem_ranges(opts) { return listRanges((opts && opts.protections) || []); },
  mem_read(addrStr, size) { return readBytes(addrStr, size >>> 0); },
  mem_write(addrStr, bytes) { return writeBytes(addrStr, bytes); },
  mem_readtyped(addrStr, type) { return readTyped(addrStr, type); },
  mem_writetyped(addrStr, type, value) { return writeTyped(addrStr, type, value); },
  mem_scan(opts) { return scan(opts || {}); },
  mem_refine(addrs, opts) {
    // Filter an existing address set by applying the same comparison logic
    const type = (opts && opts.type) || 'int';
    const cmp = (opts && opts.cmp) || 'eq';
    const value = opts ? opts.value : undefined;
    const value2 = opts ? opts.value2 : undefined;
    const decimals = (opts && typeof opts.decimals === 'number') ? opts.decimals : 1;
    const tolerance = (opts && typeof opts.tolerance === 'number') ? opts.tolerance : 0;
    const out = [];

    function testNumber(n) {
      switch (cmp) {
        case 'eq': return n === value;
        case 'gt': return n > value;
        case 'lt': return n < value;
        case 'ge': return n >= value;
        case 'le': return n <= value;
        case 'between': return n >= Math.min(value, value2) && n <= Math.max(value, value2);
        case 'approx': {
          if (tolerance > 0) return Math.abs(n - value) <= tolerance;
          const factor = Math.pow(10, decimals);
          return Math.round(n * factor) / factor === value;
        }
        default: return false;
      }
    }

    for (let i = 0; i < addrs.length; i++) {
      try {
        const p = ptr(addrs[i]);
        let n = null;
        switch (type) {
          case 'ubyte': n = p.readU8(); break;
          case 'byte': n = p.readS8(); break;
          case 'ushort': n = p.readU16(); break;
          case 'short': n = p.readS16(); break;
          case 'uint': n = p.readU32(); break;
          case 'int': n = p.readS32(); break;
          case 'ulong': n = Number(p.readU64()); break;
          case 'long': n = Number(p.readS64()); break;
          case 'float': n = p.readFloat(); break;
          case 'double': n = p.readDouble(); break;
          case 'pointer': n = Process.pointerSize === 8 ? Number(p.readU64()) : p.readU32(); break;
          case 'string': {
            const s = p.readUtf8String() || '';
            if ((cmp === 'eq' && s === String(value)) || (cmp === 'approx' && s.indexOf(String(value)) !== -1)) out.push(addrs[i]);
            continue;
          }
          default: continue;
        }
        if (n !== null && testNumber(n)) out.push(addrs[i]);
      } catch (_) {}
    }
    return out;
  },
};
`;

export default MEMORY_AGENT_SOURCE;
