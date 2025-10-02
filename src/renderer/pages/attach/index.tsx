import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/app';
import Input from '../../components/Input';
import Button from '../../components/Button';
import XStack from '../../components/XStack';
import YStack from '../../components/YStack';
import Select from '../../components/Select';
import { alert } from '../../components/Alert';

export default function AttachPage() {
  const devices = useAppStore(s => s.devices);
  const processes = useAppStore(s => s.processes);
  const selectedDeviceId = useAppStore(s => s.selectedDeviceId);
  const selectedPid = useAppStore(s => s.selectedPid);
  const selectedProcessName = useAppStore(s => s.selectedProcessName);
  const setSelectedDevice = useAppStore(s => s.setSelectedDevice);
  const setSelectedProcess = useAppStore(s => s.setSelectedProcess);
  const refreshDevices = useAppStore(s => s.refreshDevices);
  const refreshProcesses = useAppStore(s => s.refreshProcesses);
  const attachTo = useAppStore(s => s.attachTo);
  const detach = useAppStore(s => s.detach);
  const attached = useAppStore(s => s.attached);
  const loading = useAppStore(s => s.loading);

  const [filter, setFilter] = useState('');
  const [pidInput, setPidInput] = useState<string>('');
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    void refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    if (selectedDeviceId) void refreshProcesses(selectedDeviceId);
  }, [selectedDeviceId, refreshProcesses]);

  useEffect(() => {
    setPidInput(selectedPid != null ? String(selectedPid) : '');
    setNameInput(selectedProcessName ?? '');
  }, [selectedPid, selectedProcessName]);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    return processes.filter(p => p.name.toLowerCase().includes(f));
  }, [filter, processes]);

  const handleSelectDevice = (id?: string) => {
    setSelectedDevice(id);
    if (id) void refreshProcesses(id);
  };

  const handleSelectProcess = (pid: number, name: string) => {
    setSelectedProcess({ pid, name });
    setPidInput(String(pid));
    setNameInput(name);
  };

  const handleAttach = async () => {
    const pid = pidInput.trim();
    const name = nameInput.trim();
    const pidNum = pid ? Number(pid) : undefined;
    if (pid && (!Number.isFinite(pidNum!) || pidNum! <= 0)) {
      alert({ title: 'Invalid PID', description: 'PID must be a positive number.', variant: 'warning' });
      return;
    }
    if (!pid && !name) {
      alert({ title: 'Missing target', description: 'Enter a PID or process name.', variant: 'warning' });
      return;
    }
    await attachTo({ pid: pidNum, name: name || undefined });
  };

  const handleDetach = async () => {
    await detach();
  };

  return (
    <XStack p="16px" gap="16px" wrap style={{ height: '100%', overflowY: 'auto' }}>
      <YStack gap="16px" style={{ flex: 2, minWidth: 320 }}>
        <strong>Device Selection</strong>
        <XStack gap="8px" wrap alignCenter>
          <Select value={selectedDeviceId || ''} onChange={(e) => handleSelectDevice(e.target.value || undefined)} style={{ minWidth: 220 }}>
            <option value="">Local Device</option>
            {devices.map(device => (
              <option key={device.id} value={device.id}>{device.name} ({device.type})</option>
            ))}
          </Select>
          <Button onClick={() => void refreshDevices()} disabled={loading}>Refresh Devices</Button>
        </XStack>
        <strong>Process List</strong>
        <XStack gap="8px" wrap>
          <Input
            placeholder="Filter processes"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: 200 }}
          />
          <Button onClick={() => selectedDeviceId ? void refreshProcesses(selectedDeviceId) : void refreshProcesses() } disabled={loading}>Refresh Processes</Button>
        </XStack>
        <div style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, maxHeight: 420, overflowY: 'auto' }}>
          {filtered.length === 0 && <div style={{ padding: 12, opacity: 0.6 }}>No processes found.</div>}
          {filtered.map(proc => {
            const isSelected = selectedPid === proc.pid;
            return (
              <div
                key={proc.pid}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: isSelected ? 'rgba(59,130,246,0.12)' : 'transparent',
                  borderBottom: '1px solid rgba(229,231,235,0.6)',
                  cursor: 'pointer'
                }}
                onClick={() => handleSelectProcess(proc.pid, proc.name)}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong>{proc.name}</strong>
                  <span style={{ fontFamily: 'monospace', fontSize: 12 }}>PID: {proc.pid}</span>
                </div>
                <Button onClick={() => handleSelectProcess(proc.pid, proc.name)}>Select</Button>
              </div>
            );
          })}
        </div>
      </YStack>

      <YStack gap="16px" style={{ flex: 1, minWidth: 260 }}>
        <strong>Attach Controls</strong>
        <YStack gap="8px" style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, padding: 12 }}>
          <Input
            placeholder="PID"
            value={pidInput}
            onChange={(e) => setPidInput(e.target.value)}
          />
          <Input
            placeholder="Process name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
          />
          <Button onClick={handleAttach} disabled={loading}>Attach</Button>
          <Button onClick={handleDetach} disabled={!attached} style={{ background: '#ef4444', color: '#fff' }}>Detach</Button>
        </YStack>

        <YStack gap="8px" style={{ border: '1px solid var(--border, #e5e7eb)', borderRadius: 8, padding: 12 }}>
          <strong>Status</strong>
          <div>Attached: {attached ? 'Yes' : 'No'}</div>
          {attached && (
            <>
              <div>PID: {attached.pid ?? '—'}</div>
              <div>Name: {attached.name ?? '—'}</div>
              <div>Device: {selectedDeviceId || 'Local'}</div>
            </>
          )}
        </YStack>
      </YStack>
    </XStack>
  );
}
