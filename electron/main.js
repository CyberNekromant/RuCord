import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Создаем require для работы в ES-модулях
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 940,
    minHeight: 500,
    backgroundColor: '#0f1014', // Match the app background to prevent white flash
    titleBarStyle: 'hidden', // Скрываем нативный заголовок, но оставляем кнопки управления (на Win/Mac)
    titleBarOverlay: {
      color: '#0f1014',
      symbolColor: '#ffffff',
      height: 30
    },
    // autoHideMenuBar: true, // Это для win/linux, titleBarStyle hidden лучше для кастомного UI
    icon: path.join(__dirname, '../public/icon.png'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      webSecurity: false // Иногда нужно для P2P в локальной разработке, но лучше включить в проде
    },
  });

  // Determine if we are in Dev mode or Production
  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open the DevTools only in dev mode
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in the default browser, not inside the app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Permissions handler for Camera/Microphone
app.on('web-contents-created', (event, contents) => {
  contents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media' || permission === 'display-capture') {
      return true;
    }
    return true;
  });
  
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media' || permission === 'display-capture') {
      callback(true);
      return;
    }
    callback(true);
  });
});