import { contextBridge } from 'electron';

// Optional: lazily require frida in preload to avoid errors if binding missing during early dev
let fridaVersion: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const frida = require('frida');
  fridaVersion = (frida && frida.version) || null;
} catch (e) {
  fridaVersion = null;
}

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  versions: process.versions,
  fridaVersion,
});

declare global {
  interface Window {
    api: {
      platform: NodeJS.Platform;
      versions: Record<string, string>;
      fridaVersion: string | null;
    };
  }
}

