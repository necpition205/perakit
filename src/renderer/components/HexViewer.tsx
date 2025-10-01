import React, { useEffect, useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useMemoryStore, MemType } from '../store/memory';
import Button from './Button';
import { useAppStore } from '../store/app';

const Wrap = styled.div`
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
`;

function toAscii(b: number) {
  if (b >= 32 && b < 127) return String.fromCharCode(b);
  return '.';
}

function formatRow(offset: number, bytes: number[], type: MemType) {
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
  const ascii = bytes.map(toAscii).join('');
  return `${offset.toString(16).padStart(8, '0')}  ${hex.padEnd(16 * 3 - 1, ' ')}   ${ascii}`;
}

export default function HexViewer({ addr, size = 256, typeView = 'byte' as MemType }: { addr: string; size?: number; typeView?: MemType }) {
  const read = useMemoryStore(s => s.read);
  const [bytes, setBytes] = useState<number[]>([]);
  const attached = useAppStore(s => s.attached);
  useEffect(() => {
    let mounted = true;
    if (attached) {
      read(addr, size).then(b => { if (mounted) setBytes(b); });
    } else {
      setBytes([]);
    }
    return () => { mounted = false; };
  }, [addr, size, read, attached]);

  const rows = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < bytes.length; i += 16) {
      out.push(formatRow(i, bytes.slice(i, i + 16), 'byte'));
    }
    return out;
  }, [bytes]);

  return (
    <Wrap>
      <pre style={{ margin: 0 }}>{rows.join('\n')}</pre>
    </Wrap>
  );
}
