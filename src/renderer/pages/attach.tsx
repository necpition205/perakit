import React, { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/app';
import Input from '../components/Input';
import Button from '../components/Button';
import YStack from '../components/YStack';
import XStack from '../components/XStack';

export default function AttachPage() {
  const devices = useAppStore(s => s.devices);
  const processes = useAppStore(s => s.processes);
  const selectedDeviceId = useAppStore(s => s.selectedDeviceId);
  const setSelectedDevice = useAppStore(s => s.setSelectedDevice);
  const refreshDevices = useAppStore(s => s.refreshDevices);
  const refreshProcesses = useAppStore(s => s.refreshProcesses);
  const attachTo = useAppStore(s => s.attachTo);
  const detach = useAppStore(s => s.detach);
  const attached = useAppStore(s => s.attached);
  const loading = useAppStore(s => s.loading);

  const [filter, setFilter] = useState('');

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  useEffect(() => {
    if (selectedDeviceId) refreshProcesses(selectedDeviceId);
  }, [selectedDeviceId, refreshProcesses]);

  const filtered = useMemo(() => {
    const f = filter.toLowerCase();
    return processes.filter(p => p.name.toLowerCase().includes(f));
  }, [filter, processes]);

  return (
    <XStack w="100%">

    </XStack>
  );
}
