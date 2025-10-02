/// <reference types="bun-types" />
import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { useMemoryStore, resetMemoryStore } from '../memory';
import { useAppStore } from '../app';

describe('memory store', () => {
  let fridaApi: Window['api']['frida'];

  beforeEach(() => {
    const mem: Window['api']['frida']['mem'] = {
      scan: mock(async () => ['0x1000']),
      refine: mock(async () => ['0x1004']),
      read: mock(async () => [1, 2, 3, 4]),
      readTyped: mock(async () => 42),
      write: mock(async () => true),
      writeTyped: mock(async () => true),
    };

    const rpcImpl = mock(async (method: string, ...args: any[]) => {
      switch (method) {
        case 'mem_scan':
          return (await mem.scan(args[0])) as unknown;
        case 'mem_refine':
          return (await mem.refine(args[0], args[1])) as unknown;
        case 'mem_read':
          return (await mem.read(args[0], args[1])) as unknown;
        case 'mem_readtyped':
          return (await mem.readTyped(args[0], args[1])) as unknown;
        case 'mem_write':
          return (await mem.write(args[0], args[1])) as unknown;
        case 'mem_writetyped':
          return (await mem.writeTyped(args[0], args[1], args[2])) as unknown;
        default:
          return null as unknown;
      }
    });

    fridaApi = {
      listDevices: mock(async () => []),
      listProcesses: mock(async () => []),
      attach: mock(async () => ({ attached: true })),
      detach: mock(async () => ({ detached: true })),
      rpc: rpcImpl as Window['api']['frida']['rpc'],
      status: mock(async () => ({
        attached: true,
        target: { pid: 1234 },
        attachedAt: Date.now(),
        masterLoaded: true,
        addonCount: 0,
      })),
      agentPing: mock(async () => ({ ok: true, version: 'test-agent' })),
      version: mock(async () => 'test-agent'),
      mem,
    };

    const api: Window['api'] = {
      platform: 'linux',
      versions: {},
      frida: fridaApi,
      onGoTab: () => () => {},
      onFridaDetached: () => () => {},
      onFridaMessage: () => () => {},
    };

    globalThis.window = { api } as Window & typeof globalThis;

    // mark session as attached and reset memory store
    useAppStore.setState(state => ({ ...state, attached: { pid: 1234 } }));
    resetMemoryStore();
  });

  it('ensures agent and runs first/next scan pipeline', async () => {
    const store = useMemoryStore.getState();

    await store.ensureLoaded();
    expect(fridaApi.agentPing).toHaveBeenCalledTimes(1);
    expect(useMemoryStore.getState().loaded).toBe(true);

    store.setValue('1337');
    await store.firstScan();
    expect(fridaApi.mem.scan).toHaveBeenCalledTimes(1);
    expect(useMemoryStore.getState().results).toEqual([{ addr: '0x1000' }]);

    await store.nextScan();
    expect(fridaApi.mem.refine).toHaveBeenCalledTimes(1);
    expect(useMemoryStore.getState().results).toEqual([{ addr: '0x1004' }]);
  });

  it('reads and writes memory through rpc bridge', async () => {
    const store = useMemoryStore.getState();
    await store.ensureLoaded();

    const bytes = await store.read('0x1000', 4);
    expect(bytes).toEqual([1, 2, 3, 4]);
    const typed = await store.readTyped('0x1004', 'int');
    expect(typed).toBe(42);

    const wroteRaw = await store.write('0x1004', [1, 2, 3]);
    const wroteTyped = await store.writeTyped('0x1004', 'int', 99);
    expect(wroteRaw).toBe(true);
    expect(wroteTyped).toBe(true);
  });
});
