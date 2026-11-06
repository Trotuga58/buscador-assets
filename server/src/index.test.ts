import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Adapter, Asset } from '../../shared/types.ts';
import { buildServer } from './index.ts';

const a: Asset = {
  id: 'm1', type: 'model3d', title: 'Árbol', author: 'Ana', license: 'cc0', licenseUrl: 'https://l',
  thumbnailUrl: null, previewUrl: null, sourceName: 'F', sourceUrl: 'https://s', downloadUrl: null, attributionText: 'x',
};
const adapter: Adapter = { name: 'F', types: ['model3d'], requiresKey: null, search: async () => [a] };

const dir = await mkdtemp(join(tmpdir(), 'srv-'));
import { mkdir, writeFile } from 'node:fs/promises';
const staticDir = join(dir, 'www');
await mkdir(join(staticDir, 'assets'), { recursive: true });
await writeFile(join(staticDir, 'index.html'), '<h1>hola</h1>');
await writeFile(join(staticDir, 'assets', 'app.js'), 'console.log(1)');
await writeFile(join(dir, 'secreto.txt'), 'SECRETO');
const env: Record<string, string | undefined> = {};
const server = buildServer({ adapters: [adapter], env, cacheDir: dir, favoritesFile: join(dir, 'fav.json'), settingsFile: join(dir, 'set.json'), staticDir });
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
after(() => server.close());

test('GET /api/health → 200', async () => {
  const r = await fetch(`${base}/api/health`);
  assert.equal(r.status, 200);
});

test('GET /api/search devuelve SearchResponse', async () => {
  const r = await fetch(`${base}/api/search?q=arbol&type=model3d`);
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.results[0].id, 'm1');
  assert.deepEqual(body.sources, [{ source: 'F', ok: true }]);
});

test('type por defecto es all', async () => {
  const r = await fetch(`${base}/api/search?q=arbol`);
  assert.equal(r.status, 200);
});

test('type inválido → 400 en español', async () => {
  const r = await fetch(`${base}/api/search?q=x&type=invalido`);
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /tipo/i);
});

test('falta q → 400', async () => {
  const r = await fetch(`${base}/api/search?type=audio`);
  assert.equal(r.status, 400);
  assert.match((await r.json()).error, /búsqueda|texto/i);
});

test('q solo espacios → 200 con lista vacía', async () => {
  const r = await fetch(`${base}/api/search?q=%20%20`);
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { results: [], sources: [] });
});

test('ruta desconocida → 404', async () => {
  assert.equal((await fetch(`${base}/api/nada`)).status, 404);
});

test('favoritos: POST, GET y DELETE', async () => {
  const post = await fetch(`${base}/api/favorites`, { method: 'POST', body: JSON.stringify(a), headers: { 'content-type': 'application/json' } });
  assert.equal(post.status, 200);
  await fetch(`${base}/api/favorites`, { method: 'POST', body: JSON.stringify(a), headers: { 'content-type': 'application/json' } });
  const list = await (await fetch(`${base}/api/favorites`)).json();
  assert.deepEqual(list.map((x: Asset) => x.id), ['m1']);
  const del = await fetch(`${base}/api/favorites/${encodeURIComponent('m1')}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
  assert.deepEqual(await (await fetch(`${base}/api/favorites`)).json(), []);
});

test('favoritos: cuerpo inválido → 400', async () => {
  const r = await fetch(`${base}/api/favorites`, { method: 'POST', body: '{"nada":1}', headers: { 'content-type': 'application/json' } });
  assert.equal(r.status, 400);
  const r2 = await fetch(`${base}/api/favorites`, { method: 'POST', body: 'no json', headers: { 'content-type': 'application/json' } });
  assert.equal(r2.status, 400);
});

test('favoritos: POST sin content-type JSON → 415 (evita envíos desde otras webs)', async () => {
  const r = await fetch(`${base}/api/favorites`, { method: 'POST', body: JSON.stringify(a), headers: { 'content-type': 'text/plain' } });
  assert.equal(r.status, 415);
  assert.deepEqual(await (await fetch(`${base}/api/favorites`)).json(), []);
});

test('favoritos: asset con URL javascript: o licencia no permitida → 400', async () => {
  const send = (body: unknown) => fetch(`${base}/api/favorites`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } });
  assert.equal((await send({ ...a, sourceUrl: 'javascript:alert(1)' })).status, 400);
  assert.equal((await send({ ...a, license: 'cc-nc' })).status, 400);
  assert.deepEqual(await (await fetch(`${base}/api/favorites`)).json(), []);
});

test('DELETE con id mal codificado → 400, no 500', async () => {
  assert.equal((await fetch(`${base}/api/favorites/%E0%A4%A`, { method: 'DELETE' })).status, 400);
});

test('estáticos: / sirve index.html y assets/app.js con su tipo', async () => {
  const r = await fetch(`${base}/`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type')!, /text\/html/);
  assert.equal(await r.text(), '<h1>hola</h1>');
  const js = await fetch(`${base}/assets/app.js`);
  assert.match(js.headers.get('content-type')!, /javascript/);
});

test('estáticos: ruta desconocida sin extensión cae en index.html; /api desconocida sigue 404', async () => {
  assert.equal(await (await fetch(`${base}/cualquier/cosa`)).text(), '<h1>hola</h1>');
  assert.equal((await fetch(`${base}/api/nada`)).status, 404);
});

test('estáticos: no se puede salir de la carpeta (../)', async () => {
  const raw = await new Promise<string>((resolve) => {
    import('node:net').then(({ connect }) => {
      const port = (server.address() as AddressInfo).port;
      const c = connect(port, '127.0.0.1', () => c.write('GET /../secreto.txt HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n'));
      let out = ''; c.on('data', (d) => (out += d)); c.on('close', () => resolve(out));
    });
  });
  assert.ok(!raw.includes('SECRETO'));
  const enc = await fetch(`${base}/..%2Fsecreto.txt`);
  assert.ok(!(await enc.text()).includes('SECRETO'));
});

test('ajustes: GET dice qué claves están configuradas, sin devolver su valor', async () => {
  const r = await (await fetch(`${base}/api/settings`)).json();
  assert.equal(r.FREESOUND_API_KEY, false);
});

test('ajustes: PUT guarda la clave (solo JSON) y la deja en env', async () => {
  const bad = await fetch(`${base}/api/settings`, { method: 'PUT', body: '{"FREESOUND_API_KEY":"zzz"}', headers: { 'content-type': 'text/plain' } });
  assert.equal(bad.status, 415);
  assert.equal(env.FREESOUND_API_KEY, undefined);
  const ok = await fetch(`${base}/api/settings`, { method: 'PUT', body: '{"FREESOUND_API_KEY":"zzz"}', headers: { 'content-type': 'application/json' } });
  assert.equal(ok.status, 200);
  assert.equal(env.FREESOUND_API_KEY, 'zzz');
  const st = await ok.json();
  assert.equal(st.FREESOUND_API_KEY, true);
  assert.ok(!JSON.stringify(st).includes('zzz'));
});
