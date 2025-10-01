import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/app';
import Input from '../components/Input';
import Button from '../components/Button';
import XStack from '../components/XStack';
import YStack from '../components/YStack';
import Select from '../components/Select';
import { List, ListItem, ListEmpty } from '../components/List';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

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
  const [attachOpen, setAttachOpen] = useState(false);
  const [pidInput, setPidInput] = useState<number | ''>('');
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    if (selectedDeviceId) refreshProcesses(selectedDeviceId);
  }, [selectedDeviceId, refreshProcesses]);

  useEffect(() => {
    // sync selection into modal inputs
    setPidInput(selectedPid ?? '');
    setNameInput(selectedProcessName ?? '');
  }, [selectedPid, selectedProcessName]);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    return processes.filter(p => p.name.toLowerCase().includes(f));
  }, [filter, processes]);

  const onConfirmAttach = async () => {
    const ok = await attachTo({ pid: typeof pidInput === 'number' ? pidInput : undefined, name: nameInput || undefined });
    if (ok) {
      setAttachOpen(false);
      toast({ title: 'Attached', description: nameInput || (selectedPid ? `PID ${selectedPid}` : ''), variant: 'success' });
    }
  };

  return (
    <XStack w="100%" h="100%" gap={0}>
      {/* Left: devices panel (scrollable) */}
      <YStack w={320} h="100%" px={12} py={16} gap={12} style={{ borderRight: '1px solid var(--border, #e5e7eb)', overflow: 'auto', minHeight: 0 }}>
        <XStack alignCenter justifyBetween>
          <strong>Devices</strong>
          <Button onClick={() => refreshDevices()} disabled={loading} px={10} py={6}>Refresh</Button>
        </XStack>
        <Select
          fullWidth
          value={selectedDeviceId || ''}
          onChange={(e) => setSelectedDevice(e.target.value || undefined)}
        >
          <option value="">Local Device</option>
          {devices.map(d => (
            <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
          ))}
        </Select>
      </YStack>

      {/* Right: processes + actions (header + scroll body) */}
      <YStack h="100%" w="100%" px={16} py={16} gap={12} style={{ minHeight: 0, overflow: 'hidden' }}>
        <XStack alignCenter gap={8}>
          <Input w={320} placeholder="Filter by name" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <Button onClick={() => selectedDeviceId && refreshProcesses(selectedDeviceId)} disabled={loading || !selectedDeviceId} px={10} py={6}>Refresh</Button>
          {attached ? (
            <Button onClick={() => detach()} disabled={loading} px={10} py={6}>Detach</Button>
          ) : null}
          <Button onClick={() => setAttachOpen(true)} disabled={loading} px={12} py={6}>Attach…</Button>
        </XStack>

        <YStack style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <List>
            {filtered.length === 0 && <ListEmpty label="No processes" />}
            {filtered.map(p => (
              <ListItem
                key={p.pid}
                active={selectedPid === p.pid}
                onClick={() => setSelectedProcess({ pid: p.pid, name: p.name })}
              >
                <strong style={{ color: 'var(--accent-900, #1e293b)', minWidth: 64 }}>[{p.pid}]</strong>
                <span>{p.name}</span>
              </ListItem>
            ))}
          </List>
        </YStack>
      </YStack>

      {/* Attach options modal */}
      <Modal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        title="Attach Options"
        footer={
          <>
            <Button onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button onClick={onConfirmAttach} disabled={loading}>Attach</Button>
          </>
        }
      >
        <YStack gap={10}>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Attach by PID</div>
            <Input
              placeholder="PID"
              value={pidInput}
              onChange={(e) => setPidInput(e.target.value ? Number(e.target.value) : '')}
              w={200}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Attach by Name</div>
            <Input
              placeholder="Process name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              w={300}
            />
          </div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>
            Leave either field empty to ignore it. If both are set, PID takes precedence.
          </div>
        </YStack>
      </Modal>
    </XStack>
  );
}
