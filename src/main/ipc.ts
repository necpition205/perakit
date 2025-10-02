import { ipcMain, BrowserWindow } from 'electron';
import { fridaService } from './frida';

let registered = false;
export function registerIpc() {
  if (registered) return;
  registered = true;
  ipcMain.handle('frida:list-devices', async () => {
    return await fridaService.listDevices();
  });

  ipcMain.handle('frida:list-processes', async (_e, deviceId?: string) => {
    return await fridaService.listProcesses(deviceId);
  });

  ipcMain.handle('frida:attach', async (_e, payload: { pid?: number; name?: string; deviceId?: string }) => {
    const { pid, name, deviceId } = payload || {};
    return await fridaService.attach({ pid, name }, deviceId);
  });

  ipcMain.handle('frida:detach', async () => {
    return await fridaService.detach();
  });

  // create-script removed; master bundle only

  ipcMain.handle('frida:rpc', async (_e, method: string, ...args: any[]) => {
    return await fridaService.rpc(method, ...args);
  });

  ipcMain.handle('frida:status', async () => fridaService.status());
  ipcMain.handle('frida:agent-ping', async () => fridaService.pingAgent());

  // forward frida service events to all renderer windows
  fridaService.events.on('detached', (reason: string) => {
    const wins = BrowserWindow.getAllWindows();
    for (const w of wins) {
      try { w.webContents.send('frida:detached', { reason }); } catch {}
    }
  });

  fridaService.events.on('message', (payload: any) => {
    const wins = BrowserWindow.getAllWindows();
    for (const w of wins) {
      try { w.webContents.send('frida:message', payload); } catch {}
    }
  });
}
