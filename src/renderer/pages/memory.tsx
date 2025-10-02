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
  const firstScan = useMemoryStore(s => s.firstScan);
  const nextScan = useMemoryStore(s => s.nextScan);
  const newScan = useMemoryStore(s => s.newScan);
  const results = useMemoryStore(s => s.results);
  const stage = useMemoryStore(s => s.stage);
  const scanning = useMemoryStore(s => s.scanning);
  const startedAt = useMemoryStore(s => s.startedAt);
  const finishedAt = useMemoryStore(s => s.finishedAt);
  const bookmarks = useMemoryStore(s => s.bookmarks);
  const logs = useMemoryStore(s => s.logs);
  const clearLogs = useMemoryStore(s => s.clearLogs);
  const addBookmark = useMemoryStore(s => s.addBookmark);
  const removeBookmark = useMemoryStore(s => s.removeBookmark);
  const setBookmarkLabel = useMemoryStore(s => s.setBookmarkLabel);
  const readTyped = useMemoryStore(s => s.readTyped);
  const writeTyped = useMemoryStore(s => s.writeTyped);

  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const attached = useAppStore(s => s.attached);

  const protOptions = useMemo(() => PROTS, []);
  // Viewer controls
  const [viewerAddr, setViewerAddr] = useState<string>('');
  const [viewerSize, setViewerSize] = useState<number>(256);
  const [viewerType, setViewerType] = useState<MemType>('byte' as any);
  function goDelta(delta: number) {
    try { const base = BigInt(viewerAddr); const next = base + BigInt(delta); setViewerAddr('0x' + next.toString(16)); } catch {}
  }

  // Library write/read transient state
  const [libValue, setLibValue] = useState<Record<string, string>>({});
  const [libRead, setLibRead] = useState<Record<string, string>>({});

  return (
    <XStack w="100%" h="100%" gap={0}>
      <YStack w={380} h="100%" px={16} py={16} gap={12} style={{ borderRight: '1px solid var(--border, #e5e7eb)', overflow: 'auto', minHeight: 0 }}>
        <strong>Scan</strong>
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
        <YStack alignCenter gap={8} w="100%">
          <XStack alignCenter gap={8} w="100%">
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
                <option value="approx">approx</option>
              </Select>
            </div>
          </XStack>
          <XStack alignCenter gap={8} w="100%">
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
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Decimals</div>
                  <Input value={decimals} onChange={(e) => setDecimals(Number(e.target.value))} />
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Tolerance</div>
                  <Input value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
                </div>
              </>
            )}
          </XStack>
          <XStack alignCenter gap={8} w="100%">
            <div>
              <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Limit</div>
              <Input value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
            </div>
          </XStack>
        </YStack>
        <XStack gap={8}>
          <Button onClick={() => firstScan()} disabled={!attached || stage !== 'idle' || scanning}>First Scan</Button>
          <Button onClick={() => nextScan()} disabled={!attached || results.length === 0 || scanning}>Next Scan</Button>
          <Button onClick={() => newScan()} disabled={scanning}>New Scan</Button>
        </XStack>
        <div style={{ height: 6, borderRadius: 3, background: '#f3f4f6', overflow: 'hidden' }}>
          {scanning ? (
            <div style={{ width: '40%', height: '100%', background: 'linear-gradient(90deg, #c7d2fe, #a5b4fc)', animation: 'indet 1s infinite', borderRadius: 3 }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
          )}
        </div>
        <style>{`@keyframes indet{0%{margin-left:-40%}100%{margin-left:100%}}`}</style>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          {scanning ? 'Scanning…' : (finishedAt && startedAt ? `Done in ${Math.max(0, finishedAt - startedAt)} ms` : 'Idle')}
          {stage !== 'idle' ? ` • Stage: ${stage}` : ''}
        </div>
      </YStack>

      <YStack h="100%" w="100%" px={16} py={16} gap={12} style={{ minHeight: 0, overflow: 'hidden' }}>
        <XStack alignCenter justifyBetween>
          <strong>Results ({results.length})</strong>
          {!attached && (
            <div style={{ fontSize: 12, opacity: 0.8 }}>Attach to a process to enable scanning and memory access.</div>
          )}
        </XStack>
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
        <div style={{ borderTop: '1px solid var(--border, #e5e7eb)', paddingTop: 12 }}>
          <XStack alignCenter gap={8} mb={8}>
            <strong>Viewer</strong>
            <Input w={240} placeholder="0xADDRESS" value={viewerAddr} onChange={(e) => setViewerAddr(e.target.value)} />
            <Button onClick={() => setSelectedAddr(viewerAddr)} disabled={!attached}>Go</Button>
            <Input w={100} placeholder="Size" value={viewerSize} onChange={(e) => setViewerSize(Number(e.target.value) || 0)} />
            <Select value={viewerType as any} onChange={(e) => setViewerType(e.target.value as any)}>
              <option value="byte">byte</option>
              <option value="ushort">ushort</option>
              <option value="uint">uint</option>
              <option value="ulong">ulong</option>
              <option value="float">float</option>
              <option value="double">double</option>
            </Select>
            <Button onClick={() => goDelta(-viewerSize)} disabled={!attached}>Prev</Button>
            <Button onClick={() => goDelta(viewerSize)} disabled={!attached}>Next</Button>
            {selectedAddr && (
              <Button onClick={() => addBookmark({ addr: selectedAddr, type, label: '' })} disabled={!attached}>Add to Library</Button>
            )}
          </XStack>
          {attached && selectedAddr && (
            <HexViewer addr={selectedAddr} size={viewerSize} typeView={viewerType} />
          )}
          <div style={{ marginTop: 12, borderTop: '1px dashed var(--border, #e5e7eb)', paddingTop: 8 }}>
            <XStack alignCenter justifyBetween mb={6}>
              <strong>Scan Logs</strong>
              <Button onClick={() => clearLogs()} disabled={logs.length === 0}>Clear</Button>
            </XStack>
            <div style={{ maxHeight: 180, overflow: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 12, background: '#f9fafb', border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, padding: 8 }}>
              {logs.length === 0 && <div style={{ opacity: 0.6 }}>No logs</div>}
              {logs.map((l, i) => (
                <div key={i} style={{ color: l.level === 'error' ? '#dc2626' : l.level === 'warn' ? '#d97706' : '#111827' }}>
                  {new Date(l.ts).toLocaleTimeString()} [{l.level}] {l.text}
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <strong>Library</strong>
            {bookmarks.length === 0 && <div style={{ fontSize: 12, opacity: 0.8 }}>No saved addresses</div>}
            {bookmarks.map(b => (
              <div key={b.addr} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr auto auto auto', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px dashed var(--border, #e5e7eb)' }}>
                <Input w={200} placeholder="Label" value={b.label || ''} onChange={(e) => setBookmarkLabel(b.addr, e.target.value)} />
                <code style={{ fontSize: 12 }}>{b.addr}</code>
                <span style={{ fontSize: 12, opacity: 0.8 }}>{b.type}</span>
                <Button onClick={async () => {
                  const v = await readTyped(b.addr, b.type);
                  setLibRead(prev => ({ ...prev, [b.addr]: String(v) }));
                }} disabled={!attached}>Read</Button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Input w={120} placeholder="Value" value={libValue[b.addr] || ''} onChange={(e) => setLibValue(prev => ({ ...prev, [b.addr]: e.target.value }))} />
                  <Button onClick={async () => {
                    const raw = libValue[b.addr];
                    let v: any = raw;
                    if (b.type !== 'string' && b.type !== 'pointer') v = Number(raw);
                    await writeTyped(b.addr, b.type, v);
                  }} disabled={!attached}>Write</Button>
                </div>
                <Button onClick={() => removeBookmark(b.addr)}>
                  Remove
                </Button>
                {libRead[b.addr] && <div style={{ gridColumn: '1 / -1', fontSize: 12, opacity: 0.8 }}>Last: {libRead[b.addr]}</div>}
              </div>
            ))}
          </div>
        </div>
      </YStack>
    </XStack>
  );
}
