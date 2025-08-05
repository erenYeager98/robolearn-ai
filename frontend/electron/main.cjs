const { app, BrowserWindow, Menu,ipcMain, session } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';
const { exec } = require('child_process');


let mainWindow;
app.commandLine.appendSwitch('enable-unsafe-swiftshader');
session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
  if (permission === 'media') {
    callback(true); // Approve camera/microphone
  } else {
    callback(false);
  }
});
function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
      enableBlinkFeatures: 'MediaStream',
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js'),
      media: {
        audio: true,
        video: true
      }
    },
    icon: path.join(__dirname, '../public/vite.svg'),
    titleBarStyle: 'default',
    show: false // Don't show until ready
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();
  ipcMain.on('launch-onboard', () => {
  console.log('Launching onboard...');

  exec('onboard', { env: { DISPLAY: ':0', ...process.env } }, (err, stdout, stderr) => {
    if (err) console.error('Onboard launch error:', err.message);
    if (stderr) console.error('Onboard stderr:', stderr);
    if (stdout) console.log('Onboard stdout:', stdout);
  });
});
  // Create application menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Search',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationURL) => {
    navigationEvent.preventDefault();
    require('electron').shell.openExternal(navigationURL);
  });
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      console.log('Media permission requested:', webContents.getURL());
      // Always allow media access (camera/mic)
      callback(true);
      console.log('Media permission granted');
    } else {
      callback(false); // deny all others
    }
  });

  createWindow();
  navigator.mediaDevices.enumerateDevices().then(devices => {
  console.log(devices);
});
});
