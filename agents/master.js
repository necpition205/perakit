📦
13631 /agents/src/index.js
✄
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// frida-builtins:/node-globals.js
var init_node_globals = __esm({
  "frida-builtins:/node-globals.js"() {
    "use strict";
  }
});

// agents/src/mappings.ts
var require_mappings = __commonJS({
  "agents/src/mappings.ts"(exports) {
    "use strict";
    init_node_globals();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.typeToCode = typeToCode;
    exports.cmpToCode = cmpToCode;
    var MEM_CODES = {
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
      pointer: 11
    };
    var CMP_CODES = {
      eq: 1,
      gt: 2,
      lt: 3,
      ge: 4,
      le: 5,
      between: 6,
      approx: 7
    };
    function typeToCode(type) {
      if (type === "string")
        return 6;
      return MEM_CODES[type] ?? 6;
    }
    function cmpToCode(cmp) {
      return CMP_CODES[cmp] ?? 1;
    }
  }
});

// agents/src/index.ts
var require_index = __commonJS({
  "agents/src/index.ts"(exports) {
    init_node_globals();
    Object.defineProperty(exports, "__esModule", { value: true });
    var mappings_1 = require_mappings();
    function listRanges(protections) {
      const want = protections && protections.length ? protections : ["rw-", "rwx", "r--", "r-x"];
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const prot of want) {
        try {
          const ranges = Process.enumerateRanges({ protection: prot, coalesce: true });
          for (const r of ranges) {
            const key = r.base.toString() + ":" + String(r.size);
            if (seen.has(key))
              continue;
            seen.add(key);
            out.push({ base: r.base.toString(), size: Number(r.size), protection: r.protection, file: r.file ? { path: r.file.path } : null });
          }
        } catch {
        }
      }
      return out;
    }
    function np(addrStr) {
      return ptr(addrStr);
    }
    function readBytes(addrStr, size) {
      const buf = np(addrStr).readByteArray(size);
      if (!buf)
        return [];
      const u8 = new Uint8Array(buf);
      return Array.from(u8);
    }
    function writeBytes(addrStr, bytes) {
      const payload = bytes instanceof ArrayBuffer ? bytes : new Uint8Array(bytes).buffer;
      np(addrStr).writeByteArray(payload);
      return true;
    }
    function readTyped(addr, type) {
      const p = np(addr);
      switch (type) {
        case "ubyte":
          return p.readU8();
        case "byte":
          return p.readS8();
        case "ushort":
          return p.readU16();
        case "short":
          return p.readS16();
        case "uint":
          return p.readU32();
        case "int":
          return p.readS32();
        case "ulong":
          return Number(p.readU64());
        case "long":
          return Number(p.readS64());
        case "float":
          return p.readFloat();
        case "double":
          return p.readDouble();
        case "pointer":
          return p.readPointer().toString();
        case "string":
          return p.readUtf8String() || "";
      }
    }
    function writeTyped(addr, type, value) {
      const p = np(addr);
      switch (type) {
        case "ubyte":
          p.writeU8(value >>> 0);
          break;
        case "byte":
          p.writeS8(value | 0);
          break;
        case "ushort":
          p.writeU16(value >>> 0);
          break;
        case "short":
          p.writeS16(value | 0);
          break;
        case "uint":
          p.writeU32(value >>> 0);
          break;
        case "int":
          p.writeS32(value | 0);
          break;
        case "ulong":
          p.writeU64(new UInt64(String(value)));
          break;
        case "long":
          p.writeS64(new Int64(String(value)));
          break;
        case "float":
          p.writeFloat(Number(value));
          break;
        case "double":
          p.writeDouble(Number(value));
          break;
        case "pointer":
          p.writePointer(ptr(String(value)));
          break;
        case "string":
          p.writeUtf8String(String(value));
          break;
      }
      return true;
    }
    var NATIVE_SCAN_SRC = [
      "#include <stdint.h>",
      "#include <stddef.h>",
      "#include <math.h>",
      "#include <string.h>",
      "enum ScanType { T_UBYTE=1, T_BYTE, T_USHORT, T_SHORT, T_UINT, T_INT, T_ULONG, T_LONG, T_FLOAT, T_DOUBLE, T_POINTER };",
      "enum CmpOp { CMP_EQ=1, CMP_GT, CMP_LT, CMP_GE, CMP_LE, CMP_BETWEEN, CMP_APPROX };",
      "static double round_dec(double x, int decimals) { if (decimals <= 0) return floor(x + 0.5); double f = 1.0; for (int i=0;i<decimals;i++) f *= 10.0; return floor(x * f + 0.5) / f; }",
      "static int testd(double n, int cmp, double v1, double v2, int decimals, double tol) { switch (cmp) { case CMP_EQ: return n==v1; case CMP_GT: return n>v1; case CMP_LT: return n<v1; case CMP_GE: return n>=v1; case CMP_LE: return n<=v1; case CMP_BETWEEN: return (n >= (v1 < v2 ? v1 : v2)) && (n <= (v1 > v2 ? v1 : v2)); case CMP_APPROX: { if (tol>0.0) return fabs(n - v1) <= tol; return round_dec(n, decimals) == v1; } default: return 0; } }",
      "static uint64_t scan_block_num(const uint8_t* base, uint64_t len, int type, int cmp, double v1, double v2, int decimals, double tol, void** out, uint64_t out_cap, int ptr_size) { uint64_t hits=0, step=1; for (uint64_t off=0; off<len;) { double n=0.0; switch(type){ case T_UBYTE: step=1; n=(double)base[off]; break; case T_BYTE: step=1; n=(double)(int8_t)base[off]; break; case T_USHORT: step=2; if(off+2<=len){ uint16_t x; memcpy(&x, base+off, 2); n=(double)x; } break; case T_SHORT: step=2; if(off+2<=len){ int16_t x; memcpy(&x, base+off, 2); n=(double)x; } break; case T_UINT: step=4; if(off+4<=len){ uint32_t x; memcpy(&x, base+off, 4); n=(double)x; } break; case T_INT: step=4; if(off+4<=len){ int32_t x; memcpy(&x, base+off, 4); n=(double)x; } break; case T_ULONG: step=8; if(off+8<=len){ uint64_t x; memcpy(&x, base+off, 8); n=(double)x; } break; case T_LONG: step=8; if(off+8<=len){ int64_t x; memcpy(&x, base+off, 8); n=(double)x; } break; case T_FLOAT: step=4; if(off+4<=len){ float x; memcpy(&x, base+off, 4); n=(double)x; } break; case T_DOUBLE: step=8; if(off+8<=len){ double x; memcpy(&x, base+off, 8); n=x; } break; case T_POINTER: step=(uint64_t)ptr_size; if(off+step<=len){ if(ptr_size==8){ uint64_t x; memcpy(&x, base+off, 8); n=(double)x; } else { uint32_t x; memcpy(&x, base+off, 4); n=(double)x; } } break; default: step=1; break;} if(off+step>len) break; if(testd(n,cmp,v1,v2,decimals,tol)){ if(hits<out_cap) out[hits]=(void*)(base+off); hits++; if(hits>=out_cap) return hits; } off+=step; } return hits; }",
      "static uint64_t scan_block_str(const uint8_t* base, uint64_t len, const uint8_t* pat, uint64_t pat_len, void** out, uint64_t out_cap){ if(pat_len==0) return 0; uint64_t hits=0; for(uint64_t i=0;i+pat_len<=len;i++){ if(memcmp(base+i, pat, pat_len)==0){ if(hits<out_cap) out[hits]=(void*)(base+i); hits++; if(hits>=out_cap) return hits; } } return hits; }",
      "void* scan_block_num_export = (void*)&scan_block_num; void* scan_block_str_export = (void*)&scan_block_str;"
    ].join("\n");
    var nativeScan = null;
    function ensureNative() {
      if (nativeScan)
        return nativeScan;
      const mod = new CModule(NATIVE_SCAN_SRC);
      const numPtr = mod.scan_block_num_export;
      const strPtr = mod.scan_block_str_export;
      nativeScan = {
        num: new NativeFunction(numPtr, "uint64", ["pointer", "uint64", "int", "int", "double", "double", "int", "double", "pointer", "uint64", "int"]),
        str: new NativeFunction(strPtr, "uint64", ["pointer", "uint64", "pointer", "uint64", "pointer", "uint64"])
      };
      return nativeScan;
    }
    function scan(opts) {
      const protections = opts.protections || ["rw-", "rwx"];
      const type = opts.type || "int";
      const cmp = opts.cmp || "eq";
      const value = opts.value;
      const value2 = opts.value2;
      const decimals = typeof opts.decimals === "number" ? opts.decimals : 1;
      const tolerance = typeof opts.tolerance === "number" ? opts.tolerance : 0;
      const maxHits = typeof opts.limit === "number" ? opts.limit : 5e3;
      const ranges = listRanges(protections);
      const hits = [];
      const native = ensureNative();
      const num = native.num;
      const str = native.str;
      function pushHit(address) {
        hits.push(address.toString());
        return hits.length >= maxHits;
      }
      for (const r of ranges) {
        try {
          const cur = ptr(r.base);
          const size = r.size >>> 0;
          const remaining = maxHits - hits.length;
          if (remaining <= 0)
            break;
          const cap = Math.min(remaining, 1e5);
          const outBuf = Memory.alloc(cap * Process.pointerSize);
          if (type === "string") {
            const patStr = String(value || "");
            if (!patStr)
              continue;
            const patMem = Memory.alloc(patStr.length);
            const u8 = new Uint8Array(patStr.length);
            for (let i = 0; i < patStr.length; i++)
              u8[i] = patStr.charCodeAt(i) & 255;
            patMem.writeByteArray(Array.from(u8));
            const found = Number(str(cur, size, patMem, patStr.length >>> 0, outBuf, cap >>> 0));
            for (let i = 0; i < found; i++) {
              const hitAddr = outBuf.add(i * Process.pointerSize).readPointer();
              if (pushHit(hitAddr))
                return hits;
            }
          } else {
            const found = Number(num(cur, size, (0, mappings_1.typeToCode)(type), (0, mappings_1.cmpToCode)(cmp), Number(value || 0), Number(value2 || 0), decimals | 0, Number(tolerance || 0), outBuf, cap >>> 0, Process.pointerSize));
            for (let i = 0; i < found; i++) {
              const hitAddr = outBuf.add(i * Process.pointerSize).readPointer();
              if (pushHit(hitAddr))
                return hits;
            }
          }
        } catch {
        }
      }
      return hits;
    }
    function refine(addrs, opts) {
      const type = opts.type || "int";
      const cmp = opts.cmp || "eq";
      const value = opts.value;
      const value2 = opts.value2;
      const decimals = typeof opts.decimals === "number" ? opts.decimals : 1;
      const tolerance = typeof opts.tolerance === "number" ? opts.tolerance : 0;
      function test(n) {
        switch (cmp) {
          case "eq":
            return n === value;
          case "gt":
            return n > value;
          case "lt":
            return n < value;
          case "ge":
            return n >= value;
          case "le":
            return n <= value;
          case "between":
            return n >= Math.min(value, value2) && n <= Math.max(value, value2);
          case "approx": {
            if (tolerance > 0)
              return Math.abs(n - value) <= tolerance;
            const f = Math.pow(10, decimals);
            return Math.round(n * f) / f === value;
          }
        }
        return false;
      }
      const out = [];
      for (const a of addrs) {
        try {
          const p = ptr(a);
          let n = null;
          switch (type) {
            case "ubyte":
              n = p.readU8();
              break;
            case "byte":
              n = p.readS8();
              break;
            case "ushort":
              n = p.readU16();
              break;
            case "short":
              n = p.readS16();
              break;
            case "uint":
              n = p.readU32();
              break;
            case "int":
              n = p.readS32();
              break;
            case "ulong":
              n = Number(p.readU64());
              break;
            case "long":
              n = Number(p.readS64());
              break;
            case "float":
              n = p.readFloat();
              break;
            case "double":
              n = p.readDouble();
              break;
            case "pointer":
              n = Process.pointerSize === 8 ? Number(p.readU64()) : p.readU32();
              break;
            case "string": {
              const s = p.readUtf8String() || "";
              if (cmp === "eq" && s === String(value) || cmp === "approx" && s.indexOf(String(value)) !== -1)
                out.push(a);
              continue;
            }
          }
          if (n !== null && test(n))
            out.push(a);
        } catch {
        }
      }
      return out;
    }
    rpc.exports = {
      version() {
        return "master-agent@ts";
      },
      mem_ranges(opts) {
        return listRanges(opts?.protections);
      },
      mem_read(addr, size) {
        return readBytes(addr, size >>> 0);
      },
      mem_write(addr, bytes) {
        return writeBytes(addr, bytes);
      },
      mem_readtyped(addr, type) {
        return readTyped(addr, type);
      },
      mem_writetyped(addr, type, value) {
        return writeTyped(addr, type, value);
      },
      mem_scan(opts) {
        return scan(opts || {});
      },
      mem_refine(addrs, opts) {
        return refine(addrs || [], opts || {});
      }
    };
  }
});
export default require_index();
