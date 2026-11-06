import { build } from 'esbuild';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';

mkdirSync('/tmp/prev', { recursive: true });
const stub = { name: 'stub', setup(b) { b.onResolve({ filter: /^@(fontsource|google)/ }, (a) => ({ path: a.path, namespace: 'stub' })); b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({ contents: '', loader: 'js' })); } };
await build({ entryPoints: ['client/src/main.tsx'], bundle: true, outfile: '/tmp/prev/app.js', jsx: 'automatic', plugins: [stub], loader: { '.css': 'css' }, logLevel: 'error' });
writeFileSync('/tmp/prev/index.html', '<!doctype html><html lang="es"><head><meta charset="utf-8"><link rel="stylesheet" href="app.css"></head><body><div id="root"></div><script src="app.js"></script></body></html>');

const svg = (c) => 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect x="60" y="60" width="80" height="80" rx="12" fill="${c}"/></svg>`);
const A = (o) => ({ thumbnailUrl: svg('#3355ff'), previewUrl: null, downloadUrl: null, licenseUrl: 'https://x', attributionText: 'x', ...o });
const results = [
  A({ id: '1', type: 'model3d', title: 'Kenney Nature Kit', author: 'Kenney', license: 'cc0', sourceName: 'Lista curada', sourceUrl: 'https://kenney.nl' }),
  A({ id: '2', type: 'model3d', title: 'Low poly tree', author: 'Ana', license: 'cc-by', sourceName: 'Poly Pizza', sourceUrl: 'https://poly.pizza', downloadUrl: 'https://x/t.glb' }),
  A({ id: '3', type: 'audio', title: 'Calm loop', author: 'Kevin MacLeod', license: 'cc-by', sourceName: 'Freesound', sourceUrl: 'https://freesound.org', previewUrl: 'https://x/a.mp3' }),
  A({ id: '4', type: 'font', title: 'Lobster', author: 'Google Fonts', license: 'ofl', sourceName: 'Google Fonts', sourceUrl: 'https://fonts.google.com', downloadUrl: 'https://x' }),
];
const srv = createServer((req, res) => {
  const f = req.url === '/' ? 'index.html' : req.url.slice(1);
  try { res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); res.end(readFileSync('/tmp/prev/' + f)); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, colorScheme: scheme });
  await page.route('**/api/**', (r) => {
    const u = r.request().url();
    if (u.includes('/connect')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify({ command: 'C:\\Users\\Jon\\Buscador-de-assets.exe', args: ['--mcp'] }) });
    const body = u.includes('/search') ? { results, sources: [{ source: 'Poly Pizza', ok: true }, { source: 'Freesound', ok: false, error: 'sin-configurar' }] } : u.includes('settings') ? { FREESOUND_API_KEY: false } : [];
    r.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
  });
  await page.goto(base + '/');
  await page.screenshot({ path: `/tmp/prev/home-${scheme}.png` });
  // Sin pulsar Buscar: la búsqueda debe lanzarse sola al escribir.
  await page.fill('#q', 'árbol'); await page.waitForSelector('.tile', { timeout: 3000 });
  await page.screenshot({ path: `/tmp/prev/results-${scheme}.png` });
  await page.click('.tile >> nth=1'); await page.waitForSelector('.dialog');
  await page.screenshot({ path: `/tmp/prev/dialog-${scheme}.png` });
  await page.keyboard.press('Escape');
  if (scheme === 'light') { await page.click('text=Ajustes'); await page.waitForSelector('.connect'); await page.screenshot({ path: '/tmp/prev/settings-light.png', fullPage: true }); }
  await page.close();
}
await browser.close(); srv.close();
