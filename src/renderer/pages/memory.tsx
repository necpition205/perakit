import React, { useMemo, useState } from 'react';
import XStack from '../components/XStack';
import YStack from '../components/YStack';
import Select from '../components/Select';
import Input from '../components/Input';
import Button from '../components/Button';
import { List, ListItem, ListEmpty } from '../components/List';
import { useMemoryStore, MemType, Protection } from '../store/memory';
import HexViewer from '../components/HexViewer';
import { useAppStore } from '../store/app';

const TYPES: MemType[] = ['ubyte','byte','ushort','short','uint','int','ulong','long','float','double','string','pointer'];
const PROTS: Protection[] = ['rw-','rwx','r--','r-x'];

export default function MemoryPage() {
  const protections = useMemoryStore(s => s.protections);
  const type = useMemoryStore(s => s.type);
  const cmp = useMemoryStore(s => s.cmp);
  const value = useMemoryStore(s => s.value);
  const value2 = useMemoryStore(s => s.value2);
  const decimals = useMemoryStore(s => s.decimals);
  const tolerance = useMemoryStore(s => s.tolerance);
  const limit = useMemoryStore(s => s.limit);
  const setProtections = useMemoryStore(s => s.setProtections);
  const setType = useMemoryStore(s => s.setType);
  const setCmp = useMemoryStore(s => s.setCmp);
  const setValue = useMemoryStore(s => s.setValue);
  const setValue2 = useMemoryStore(s => s.setValue2);
  const setDecimals = useMemoryStore(s => s.setDecimals);
  const setTolerance = useMemoryStore(s => s.setTolerance);
  const setLimit = useMemoryStore(s => s.setLimit);
  const scan = useMemoryStore(s => s.scan);
  const results = useMemoryStore(s => s.results);

  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const attached = useAppStore(s => s.attached);

  const protOptions = useMemo(() => PROTS, []);

  return (
    <XStack w="100%" h="100%" gap={0}>
      <YStack w={340} h="100%" px={12} py={16} gap={10} style={{ borderRight: '1px solid var(--border, #e5e7eb)', overflow: 'auto', minHeight: 0 }}>
        <strong>Scan Filters</strong>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Protections</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {protOptions.map(p => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={protections.includes(p)} onChange={(e) => {
                  if (e.target.checked) setProtections([...protections, p]);
                  else setProtections(protections.filter(x => x !== p));
                }} />
                {p}
              </label>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Type</div>
          <Select value={type} onChange={(e) => setType(e.target.value as MemType)}>
            {TYPES.map(t => (<option key={t} value={t}>{t}</option>))}
          </Select>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Compare</div>
          <Select value={cmp} onChange={(e) => setCmp(e.target.value as any)}>
            <option value="eq">equal</option>
            <option value="gt">greater</option>
            <option value="lt">less</option>
            <option value="ge">≥</option>
            <option value="le">≤</option>
            <option value="between">between</option>
            <option value="approx">approx(round/tolerance)</option>
          </Select>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Value</div>
          <Input value={(value as any) ?? ''} onChange={(e) => setValue((type === 'string') ? e.target.value : Number(e.target.value))} />
        </div>
        {(cmp === 'between') && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Value2</div>
            <Input value={value2 ?? ''} onChange={(e) => setValue2(Number(e.target.value))} />
          </div>
        )}
        {(type === 'float' || type === 'double') && (
          <>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Decimals (approx)</div>
              <Input value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} />
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Tolerance (approx)</div>
              <Input value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
            </div>
          </>
        )}
        <div>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Limit</div>
          <Input value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
        </div>
        <Button onClick={() => scan()} disabled={!attached}>Scan</Button>
      </YStack>

      <YStack h="100%" w="100%" px={16} py={16} gap={12} style={{ minHeight: 0, overflow: 'hidden' }}>
        <strong>Results</strong>
        {!attached && (
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            Attach to a process to enable scanning and memory access.
          </div>
        )}
        <YStack style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <List>
            {results.length === 0 && <ListEmpty label="No results" />}
            {results.map(r => (
              <ListItem key={r.addr} active={selectedAddr === r.addr} onClick={() => setSelectedAddr(r.addr)}>
                <code>{r.addr}</code>
              </ListItem>
            ))}
          </List>
        </YStack>
        {selectedAddr && attached && (
          <div>
            <strong>Memory @ {selectedAddr}</strong>
            <HexViewer addr={selectedAddr} />
          </div>
        )}
      </YStack>
    </XStack>
  );
}
