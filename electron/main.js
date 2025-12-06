import { app, BrowserWindow, shell, desktopCapturer, session, Tray, Menu, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fs from 'fs';

// Создаем require для работы в ES-модулях
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Определяем пути к файлам в зависимости от режима (Dev/Prod)
const isDev = !app.isPackaged;
const iconPath = isDev 
  ? path.join(__dirname, '../public/icon.png') 
  : path.join(__dirname, '../dist/icon.png');

let mainWindow;
let tray = null;
let isQuitting = false;

// Файл для сохранения состояния окна
const windowStateFile = path.join(app.getPath('userData'), 'window-state.json');

function saveWindowState() {
  if (!mainWindow) return;
  const bounds = mainWindow.getBounds();
  fs.writeFileSync(windowStateFile, JSON.stringify(bounds));
}

function loadWindowState() {
  try {
    const data = fs.readFileSync(windowStateFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { width: 1280, height: 800 }; // Default size
  }
}

// SINGLE INSTANCE LOCK
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Если пользователь пытается запустить вторую копию, фокусируемся на первой
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

function createWindow() {
  const windowState = loadWindowState();

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 940,
    minHeight: 500,
    backgroundColor: '#0f1014',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f1014',
      symbolColor: '#ffffff',
      height: 30
    },
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true, // Можно выключить в проде: isDev
      webSecurity: false 
    },
    show: false // Скрываем до полной загрузки, чтобы не моргало
  });

  // Загрузка контента
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Показываем окно только когда оно готово
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Сохраняем состояние при закрытии/изменении размера
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move', saveWindowState);
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    saveWindowState();
  });

  // Открытие внешних ссылок в браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // --- SCREEN SHARE HANDLER ---
  mainWindow.webContents.session.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      if (sources.length > 0) {
        callback({ video: sources[0], audio: false });
      } else {
        callback(null);
      }
    }).catch((error) => {
      console.error(error);
      callback(null);
    });
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Открыть RuCord', 
      click: () => {
        if (mainWindow) mainWindow.show();
      } 
    },
    { type: 'separator' },
    { 
      label: 'Выход', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    }
  ]);

  tray.setToolTip('RuCord');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Не выходим из приложения, если закрыты окна (работает в фоне)
    // app.quit(); 
  }
});

// Permissions handler
app.on('web-contents-created', (event, contents) => {
  contents.session.setPermissionCheckHandler((webContents, permission) => {
    return true;
  });
  contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    callback(true);
  });
});