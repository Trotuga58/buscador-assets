// Ventana de escritorio: arranca el servidor dentro de la app y carga la web empaquetada.
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let server;
const bundle = () => import(pathToFileURL(path.join(__dirname, '..', 'dist-electron', 'server.mjs')).href);

// `Buscador-de-assets.exe --mcp`: sin ventana, habla con Claude por entrada/salida estándar y termina al cerrarse.
async function runMcp() {
  const { startMcp } = await bundle();
  await startMcp({
    dataDir: app.getPath('userData'),
    downloadsDir: path.join(app.getPath('documents'), 'Buscador de assets', 'descargas'),
  });
  app.quit();
}

async function createWindow() {
  const { startServer } = await bundle();
  const started = await startServer({
    port: 0, // un puerto libre cualquiera
    dataDir: app.getPath('userData'), // favoritos, caché y claves viven aquí
    staticDir: path.join(__dirname, '..', 'dist', 'client'),
    exePath: process.env.PORTABLE_EXECUTABLE_FILE || (app.isPackaged ? process.execPath : undefined), // el .exe portable se desempaqueta en una carpeta temporal
  });
  server = started.server;

  const win = new BrowserWindow({ width: 1200, height: 800, title: 'Buscador de assets libres', autoHideMenuBar: true });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  await win.loadURL(`http://127.0.0.1:${started.port}`);
}

if (process.argv.includes('--mcp')) {
  app.disableHardwareAcceleration();
  app.whenReady().then(runMcp);
} else {
  const single = app.requestSingleInstanceLock();
  if (!single) app.quit();
  else app.whenReady().then(createWindow);
}

app.on('window-all-closed', () => { if (server) server.close(); app.quit(); });
