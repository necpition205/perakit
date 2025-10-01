import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { registerIpc } from './ipc';

const isDev = !app.isPackaged;
const devServerUrl = process.env.VITE_DEV_SERVER_URL || '';

let mainWindow: BrowserWindow | null = null;

function getPreloadPath() {
  if (isDev) {
    // In dev, we compile preload to dist/preload
    return path.join(__dirname.replace(/dist[\\/].*$/, ''), 'dist', 'preload', 'preload.js');
  }
  return path.join(__dirname, '..', 'preload', 'preload.js');
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    autoHideMenuBar: true,
    titleBarOverlay: true,
    accentColor: '#000000'
  });

  if (isDev && devServerUrl) {
    await mainWindow.loadURL(devServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(__dirname, '..', 'renderer', 'index.html');
    if (fs.existsSync(indexPath)) {
      await mainWindow.loadFile(indexPath);
    } else {
      await mainWindow.loadURL('data:text/plain,Renderer bundle not found');
    }
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  })
}

app.whenReady().then(async () => {
  registerIpc();
  await createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
