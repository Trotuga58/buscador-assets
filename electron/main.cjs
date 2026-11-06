// Ventana de escritorio: arranca el servidor dentro de la app y carga la web empaquetada.
const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

let server;

async function createWindow() {
  const { startServer } = await import(pathToFileURL(path.join(__dirname, '..', 'dist-electron', 'server.mjs')).href);
  const started = await startServer({
    port: 0, // un puerto libre cualquiera
    dataDir: app.getPath('userData'), // favoritos, caché y claves viven aquí
    staticDir: path.join(__dirname, '..', 'dist', 'client'),
  });
  server = started.server;

  const win = new BrowserWindow({ width: 1200, height: 800, title: 'Buscador de assets libres', autoHideMenuBar: true });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  await win.loadURL(`http://127.0.0.1:${started.port}`);
}

const single = app.requestSingleInstanceLock();
if (!single) app.quit();
else app.whenReady().then(createWindow);

app.on('window-all-closed', () => { if (server) server.close(); app.quit(); });
