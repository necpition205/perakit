import { ipcMain } from 'electron';
import { fridaService } from './frida';

export function registerIpc() {
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

  ipcMain.handle('frida:create-script', async (_e, source: string) => {
    return await fridaService.createScript(source);
  });

  ipcMain.handle('frida:rpc', async (_e, method: string, ...args: any[]) => {
    return await fridaService.rpc(method, ...args);
  });
}

