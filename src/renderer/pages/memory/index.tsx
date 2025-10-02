import React, { useCallback, useState } from 'react';
import XStack from '../../components/XStack';
import YStack from '../../components/YStack';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Select from '../../components/Select';
import { alert } from '../../components/Alert';
import {
  useMemoryStore,
  type MemType,
  type Protection,
  type CompareMode,
} from '../../store/memory';
import { useAppStore } from '../../store/app';

const TYPE_OPTIONS: MemType[] = ['ubyte','byte','ushort','short','uint','int','ulong','long','float','double','string','pointer'];
const PROTECTION_OPTIONS: Protection[] = ['rw-','rwx','r--','r-x'];
const CMP_OPTIONS: CompareMode[] = ['eq','gt','lt','ge','le','between','approx'];

export default function MemoryPage() {
  const protections = useMemoryStore(s => s.protections);
  const type = useMemoryStore(s => s.type);
  const cmp = useMemoryStore(s => s.cmp);
  const value = useMemoryStore(s => s.value);
  const value2 = useMemoryStore(s => s.value2);
  const results = useMemoryStore(s => s.results);
  const scanning = useMemoryStore(s => s.scanning);
  const ensureLoaded = useMemoryStore(s => s.ensureLoaded);
  const setProtections = useMemoryStore(s => s.setProtections);
  const setType = useMemoryStore(s => s.setType);
  const setCmp = useMemoryStore(s => s.setCmp);
  const setValue = useMemoryStore(s => s.setValue);
  const setValue2 = useMemoryStore(s => s.setValue2);
  const newScan = useMemoryStore(s => s.newScan);
  const firstScan = useMemoryStore(s => s.firstScan);
  const nextScan = useMemoryStore(s => s.nextScan);
  const readTyped = useMemoryStore(s => s.readTyped);

  const attached = useAppStore(s => s.attached);
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [readPreview, setReadPreview] = useState<string>('');

  const toggleProtection = useCallback((prot: Protection) => {
    const next = protections.includes(prot)
      ? protections.filter(p => p !== prot)
      : [...protections, prot];
    setProtections(next);
  }, [protections, setProtections]);

  const runEnsure = useCallback(async () => {
    try {
      await ensureLoaded();
      alert({ title: 'Agent ready', variant: 'success', duration: 1800 });
    } catch {}
  }, [ensureLoaded]);

  const handleFirstScan = useCallback(async () => {
    await firstScan();
    setSelectedAddr(null);
    setReadPreview('');
  }, [firstScan]);

  const handleNextScan = useCallback(async () => {
    await nextScan();
    setSelectedAddr(null);
    setReadPreview('');
  }, [nextScan]);

  const handleSelectAddr = useCallback(async (addr: string) => {
    setSelectedAddr(addr);
    try {
      const result = await readTyped(addr, type);
      setReadPreview(String(result));
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Read failed', description: msg, variant: 'error' });
    }
  }, [readTyped, type]);

  const showBetween = cmp === 'between';

  return (
    <YStack p="16px" gap="16px" style={{ overflowY: 'auto', height: '100%' }}>
      <YStack gap="12px" as="section">
        <strong>Scan Parameters</strong>
        <XStack gap="12px" wrap>
          <Select value={type} onChange={(e) => setType(e.target.value as MemType)}>
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
          <Select value={cmp} onChange={(e) => setCmp(e.target.value as CompareMode)}>
            {CMP_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
          <Input
            placeholder="value"
            value={value ?? ''}
            onChange={(e) => setValue(e.target.value)}
            style={{ minWidth: 140 }}
          />
          {showBetween && (
            <Input
              placeholder="value2"
              value={value2 ?? ''}
              onChange={(e) => setValue2(e.target.value as any)}
              style={{ minWidth: 140 }}
            />
          )}
        </XStack>
        <XStack gap="12px" wrap alignCenter>
          {PROTECTION_OPTIONS.map(prot => (
            <label key={prot} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="checkbox"
                checked={protections.includes(prot)}
                onChange={() => toggleProtection(prot)}
              />
              {prot}
            </label>
          ))}
        </XStack>
        <XStack gap="8px" wrap>
          <Button disabled={!attached} onClick={runEnsure}>Ensure Agent</Button>
          <Button disabled={scanning} onClick={newScan}>New Scan</Button>
          <Button disabled={scanning || !attached} onClick={handleFirstScan}>First Scan</Button>
          <Button disabled={scanning || results.length === 0} onClick={handleNextScan}>Next Scan</Button>
        </XStack>
      </YStack>

      <YStack gap="12px" as="section">
        <strong>Results ({results.length})</strong>
        <div style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, maxHeight: 260, overflowY: 'auto' }}>
          {results.length === 0 && (
            <div style={{ padding: 12, opacity: 0.6 }}>Run a scan to populate results.</div>
          )}
          {results.map(r => {
            const isSelected = selectedAddr === r.addr;
            return (
              <div
                key={r.addr}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                  borderBottom: '1px solid rgba(229,231,235,0.6)',
                  fontFamily: 'monospace',
                }}
                onClick={() => handleSelectAddr(r.addr)}
              >
                {r.addr}
              </div>
            );
          })}
        </div>
        {selectedAddr && (
          <div style={{ padding: '8px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>Last read ({type})</div>
            <strong>{selectedAddr}</strong>
            <div style={{ marginTop: 4, fontFamily: 'monospace' }}>{readPreview}</div>
          </div>
        )}
      </YStack>
    </YStack>
  );
}
