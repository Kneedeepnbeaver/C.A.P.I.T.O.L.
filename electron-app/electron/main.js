const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

// Configure Python Path (Dev vs Prod)
let PYTHON_PATH;
let SERVER_SCRIPT;
let PYTHON_CWD;

if (app.isPackaged) {
    // Production: Use bundled implementation
    // The executable is located at Contents/Resources/backend/server_rag
    PYTHON_PATH = path.join(process.resourcesPath, 'backend', 'server_rag');
    // For executable, the script arg is not needed, but spawn expects an array of args.
    // We pass empty array/no script for the executable.
    SERVER_SCRIPT = null;
    PYTHON_CWD = path.join(process.resourcesPath, 'backend');
} else {
    // Development
    PYTHON_PATH = path.resolve('../../venv/bin/python3');
    SERVER_SCRIPT = path.join(__dirname, '../api/server_rag.py');
    PYTHON_CWD = path.resolve(__dirname, '../../../');
}

function startPythonServer() {
    console.log(`Starting Python server... mode: ${app.isPackaged ? 'PROD' : 'DEV'}`);
    console.log(`path: ${PYTHON_PATH}`);
    console.log(`script: ${SERVER_SCRIPT}`);
    console.log(`cwd: ${PYTHON_CWD}`);

    try {
        const args = SERVER_SCRIPT ? [SERVER_SCRIPT] : [];
        pythonProcess = spawn(PYTHON_PATH, args, {
            cwd: PYTHON_CWD,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        pythonProcess.on('error', (err) => {
            console.error('Failed to start python process:', err);
        });
    } catch (e) {
        console.error('Spawn exception:', e);
    }

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python]: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`[Python Err]: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python process exited with code ${code}`);
    });
}

function createMenu() {
    const isMac = process.platform === 'darwin';

    // Standard template for Copy/Paste/SelectAll
    const template = [
        ...(isMac ? [{
            label: app.name,
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
        }] : []),
        {
            label: 'File',
            submenu: [
                { role: 'close' }
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
                { role: 'pasteAndMatchStyle' },
                { role: 'delete' },
                { role: 'selectAll' },
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
        }
    ];

    // check typing for Menu items, template is cast as any in JS
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false // Needed sometimes for local fetch if cors issues arise
        },
        titleBarStyle: 'hiddenInset', // Mac style
    });

    createMenu();

    // IPC Handlers for Native Dialogs
    ipcMain.handle('select-dirs', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });
        return result.filePaths;
    });

    ipcMain.handle('select-files', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile', 'multiSelections'],
            filters: [{ name: 'Documents', extensions: ['pdf', 'txt', 'docx', 'vtt'] }]
        });
        return result.filePaths;
    });

    ipcMain.handle('save-file', async (event, options) => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: options.title || 'Save File',
            defaultPath: options.defaultPath || 'document',
            filters: options.filters || [{ name: 'All Files', extensions: ['*'] }]
        });
        return result.filePath;
    });

    // In dev, load Vite server
    // In prod, load index.html
    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    } else {
        const startUrl = process.env.ELECTRON_START_URL || 'http://localhost:5173';
        // Wait a bit for React to start if running concurrently
        setTimeout(() => {
            mainWindow.loadURL(startUrl).catch(() => {
                mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
            });
        }, 1000);
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', () => {
    startPythonServer();
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('will-quit', () => {
    if (pythonProcess) {
        pythonProcess.kill();
    }
});
