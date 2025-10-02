import React, { useCallback, useMemo, useState } from 'react';
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
  type MemObj,
} from '../../store/memory';
import { useAppStore } from '../../store/app';

const TYPE_OPTIONS: MemType[] = ['ubyte','byte','ushort','short','uint','int','ulong','long','float','double','string','pointer'];
const PROTECTION_OPTIONS: Protection[] = ['rw-','rwx','r--','r-x'];
const CMP_OPTIONS: CompareMode[] = ['eq','gt','lt','ge','le','between','approx'];
const NUMERIC_TYPES: MemType[] = ['ubyte','byte','ushort','short','uint','int','ulong','long','float','double'];

export default function MemoryPage() {
  const protections = useMemoryStore(s => s.protections);
  const type = useMemoryStore(s => s.type);
  const cmp = useMemoryStore(s => s.cmp);
  const value = useMemoryStore(s => s.value);
  const value2 = useMemoryStore(s => s.value2);
  const results = useMemoryStore(s => s.results);
  const scanning = useMemoryStore(s => s.scanning);
  const lib = useMemoryStore(s => s.lib);
  const viewerAddr = useMemoryStore(s => s.viewerAddr);
  const viewerType = useMemoryStore(s => s.viewerType);
  const viewerSize = useMemoryStore(s => s.viewerSize);
  const viewerSetAddr = useMemoryStore(s => s.setViewerAddr);
  const viewerSetType = useMemoryStore(s => s.setViewerType);
  const viewerSetSize = useMemoryStore(s => s.setViewerSize);
  const ensureLoaded = useMemoryStore(s => s.ensureLoaded);
  const setProtections = useMemoryStore(s => s.setProtections);
  const setType = useMemoryStore(s => s.setType);
  const setCmp = useMemoryStore(s => s.setCmp);
  const setValue = useMemoryStore(s => s.setValue);
  const setValue2 = useMemoryStore(s => s.setValue2);
  const newScan = useMemoryStore(s => s.newScan);
  const firstScan = useMemoryStore(s => s.firstScan);
  const nextScan = useMemoryStore(s => s.nextScan);
  const read = useMemoryStore(s => s.read);
  const readTyped = useMemoryStore(s => s.readTyped);
  const addToLibrary = useMemoryStore(s => s.addToLibrary);
  const removeFromLibrary = useMemoryStore(s => s.removeFromLibrary);
  const updateLibraryLabel = useMemoryStore(s => s.updateLibraryLabel);
  const refreshLibraryValue = useMemoryStore(s => s.refreshLibraryValue);
  const clearLibrary = useMemoryStore(s => s.clearLibrary);

  const attached = useAppStore(s => s.attached);

  const [activeTab, setActiveTab] = useState<'scan' | 'viewer'>('scan');
  const [selectedAddr, setSelectedAddr] = useState<string | null>(null);
  const [readPreview, setReadPreview] = useState<string>('');
  const [viewerBytes, setViewerBytes] = useState<string>('');
  const [viewerTypedValue, setViewerTypedValue] = useState<string>('');
  const [viewerLoading, setViewerLoading] = useState(false);
  const [newLibAddr, setNewLibAddr] = useState('');
  const [newLibLabel, setNewLibLabel] = useState('');
  const [newLibType, setNewLibType] = useState<MemType>('int');
  const [labelDrafts, setLabelDrafts] = useState<Record<string, string>>({});

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
      viewerSetAddr(addr);
      viewerSetType(type);
    } catch {}
  }, [readTyped, type, viewerSetAddr, viewerSetType]);

  const handleViewerReadBytes = useCallback(async () => {
    setViewerLoading(true);
    try {
      const bytes = await read(viewerAddr, viewerSize);
      const formatted = bytes.map((b) => b.toString(16).padStart(2, '0')).join(' ');
      setViewerBytes(formatted);
    } catch {
      setViewerBytes('');
    } finally {
      setViewerLoading(false);
    }
  }, [read, viewerAddr, viewerSize]);

  const handleViewerReadTyped = useCallback(async () => {
    setViewerLoading(true);
    try {
      const result = await readTyped(viewerAddr, viewerType);
      setViewerTypedValue(result === null || result === undefined ? '' : String(result));
    } catch {
      setViewerTypedValue('');
    } finally {
      setViewerLoading(false);
    }
  }, [readTyped, viewerAddr, viewerType]);

  const handleViewerJump = useCallback((delta: number) => {
    try {
      const next = BigInt(viewerAddr || '0x0') + BigInt(delta);
      viewerSetAddr(`0x${next.toString(16)}`);
    } catch {
      alert({ title: 'Jump failed', description: 'Unable to adjust viewer address.', variant: 'warning' });
    }
  }, [viewerAddr, viewerSetAddr]);

  const handleViewerSizeChange = useCallback((input: string) => {
    const parsed = Number(input);
    if (!Number.isFinite(parsed)) {
      alert({ title: 'Invalid size', description: 'Viewer size must be numeric.', variant: 'warning' });
      return;
    }
    viewerSetSize(parsed);
  }, [viewerSetSize]);

  const handleAddLibrary = useCallback(() => {
    if (addToLibrary({ addr: newLibAddr, type: newLibType, label: newLibLabel })) {
      setNewLibAddr('');
      setNewLibLabel('');
      setNewLibType('int');
    }
  }, [addToLibrary, newLibAddr, newLibLabel, newLibType]);

  const handleUseLibraryEntry = useCallback((entry: MemObj) => {
    viewerSetAddr(entry.addr);
    viewerSetType(entry.type);
    setActiveTab('viewer');
  }, [viewerSetAddr, viewerSetType]);

  const handleUpdateLabelDraft = useCallback((addr: string, label: string) => {
    setLabelDrafts(prev => ({ ...prev, [addr]: label }));
  }, []);

  const handleCommitLabel = useCallback((addr: string) => {
    const draft = labelDrafts[addr];
    const candidate = draft !== undefined ? draft : lib.find(item => item.addr === addr)?.label ?? '';
    if (!candidate.trim()) {
      alert({ title: 'Invalid label', description: 'Label cannot be empty.', variant: 'warning' });
      return;
    }
    updateLibraryLabel(addr, candidate);
    setLabelDrafts(prev => {
      const next = { ...prev };
      delete next[addr];
      return next;
    });
  }, [labelDrafts, lib, updateLibraryLabel]);

  const handleAddSelectionToLibrary = useCallback(() => {
    if (!selectedAddr) {
      alert({ title: 'No selection', description: 'Select an address from scan results first.', variant: 'info' });
      return;
    }
    if (addToLibrary({ addr: selectedAddr, type, label: `addr_${selectedAddr}` })) {
      alert({ title: 'Saved', description: 'Address added to library.', variant: 'success', duration: 1800 });
    }
  }, [addToLibrary, selectedAddr, type]);

  const showBetween = cmp === 'between';
  const isNumericType = NUMERIC_TYPES.includes(type);
  const valueInputType = isNumericType ? 'number' : 'text';

  return (
    <XStack p="16px" gap="16px" wrap alignStart style={{ height: '100%', overflowY: 'auto' }}>
      <YStack gap="16px" style={{ flex: 3, minWidth: 320 }}>
        <XStack gap="8px">
          <Button onClick={() => setActiveTab('scan')} style={{ background: activeTab === 'scan' ? '#2563eb' : undefined, color: activeTab === 'scan' ? '#fff' : undefined }}>Scan</Button>
          <Button onClick={() => setActiveTab('viewer')} style={{ background: activeTab === 'viewer' ? '#2563eb' : undefined, color: activeTab === 'viewer' ? '#fff' : undefined }}>Viewer</Button>
        </XStack>

        {activeTab === 'scan' && (
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
                type={valueInputType}
                value={value ?? ''}
                onChange={(e) => setValue(e.target.value)}
                style={{ minWidth: 140 }}
              />
              {showBetween && (
                <Input
                  placeholder="value2"
                  type="number"
                  value={value2 ?? ''}
                  onChange={(e) => setValue2(e.target.value)}
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
              <Button disabled={!selectedAddr} onClick={handleAddSelectionToLibrary}>Save Selection</Button>
            </XStack>
            <YStack gap="8px">
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
        )}

        {activeTab === 'viewer' && (
          <YStack gap="12px" as="section">
            <strong>Memory Viewer</strong>
            <XStack gap="12px" wrap>
              <Input
                placeholder="Address (e.g. 0x1234)"
                value={viewerAddr}
                onChange={(e) => viewerSetAddr(e.target.value)}
                style={{ minWidth: 200 }}
              />
              <Select value={viewerType} onChange={(e) => viewerSetType(e.target.value as MemType)}>
                {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </Select>
              <Input
                type="number"
                placeholder="Size"
                value={viewerSize}
                onChange={(e) => handleViewerSizeChange(e.target.value)}
                style={{ width: 120 }}
              />
            </XStack>
            <XStack gap="8px" wrap>
              <Button onClick={() => handleViewerJump(-viewerSize)}>Back {viewerSize}</Button>
              <Button onClick={() => handleViewerJump(viewerSize)}>Forward {viewerSize}</Button>
              <Button onClick={handleViewerReadBytes} disabled={viewerLoading}>Read Bytes</Button>
              <Button onClick={handleViewerReadTyped} disabled={viewerLoading}>Read Typed</Button>
            </XStack>
            <YStack gap="8px">
              <div style={{ fontSize: 12, opacity: 0.75 }}>Typed value ({viewerType})</div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, fontFamily: 'monospace', minHeight: 32 }}>
                {viewerTypedValue || '—'}
              </div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Bytes ({viewerSize})</div>
              <div style={{ padding: '8px 12px', border: '1px solid var(--border, #e5e7eb)', borderRadius: 6, fontFamily: 'monospace', minHeight: 48, whiteSpace: 'pre-wrap' }}>
                {viewerBytes || '—'}
              </div>
            </YStack>
          </YStack>
        )}
      </YStack>

      <YStack gap="16px" style={{ flex: 2, minWidth: 280 }}>
        <strong>Memory Library</strong>
        <YStack gap="8px" style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, padding: 12 }}>
          <strong>Add Entry</strong>
          <Input
            placeholder="Address"
            value={newLibAddr}
            onChange={(e) => setNewLibAddr(e.target.value)}
          />
          <Input
            placeholder="Label"
            value={newLibLabel}
            onChange={(e) => setNewLibLabel(e.target.value)}
          />
          <Select value={newLibType} onChange={(e) => setNewLibType(e.target.value as MemType)}>
            {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </Select>
          <Button onClick={handleAddLibrary}>Save to Library</Button>
          <Button onClick={clearLibrary} style={{ background: '#ef4444', color: '#fff' }}>Clear Library</Button>
        </YStack>

        <YStack gap="8px" style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, padding: 12, maxHeight: 520, overflowY: 'auto' }}>
          {lib.length === 0 && <div style={{ opacity: 0.6 }}>Library is empty.</div>}
          {lib.map(item => {
            const draftLabel = labelDrafts[item.addr] ?? item.label;
            return (
              <div key={item.addr} style={{ borderBottom: '1px solid rgba(229,231,235,0.6)', paddingBottom: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <Input
                    value={draftLabel}
                    onChange={(e) => handleUpdateLabelDraft(item.addr, e.target.value)}
                    onBlur={() => handleCommitLabel(item.addr)}
                    style={{ flex: 1 }}
                  />
                  <Select value={item.type} disabled style={{ width: 120 }}>
                    <option value={item.type}>{item.type}</option>
                  </Select>
                </div>
                <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{item.addr}</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>Last value: {item.lastValue ?? '—'}</div>
                <XStack gap="8px" wrap style={{ marginTop: 8 }}>
                  <Button onClick={() => handleUseLibraryEntry(item)}>Load in Viewer</Button>
                  <Button onClick={() => { void refreshLibraryValue(item.addr); }}>Refresh</Button>
                  <Button onClick={() => removeFromLibrary(item.addr)} style={{ background: '#ef4444', color: '#fff' }}>Remove</Button>
                </XStack>
              </div>
            );
          })}
        </YStack>
      </YStack>
    </XStack>
  );
}
