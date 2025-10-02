import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/app';
import Input from '../../components/Input';
import Button from '../../components/Button';
import XStack from '../../components/XStack';
import YStack from '../../components/YStack';
import { motion } from 'framer-motion';

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
    }
  };

  return (
    <>
    </>
  );
}
