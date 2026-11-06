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
const server = buildServer({ adapters: [adapter], env: {}, cacheDir: dir, favoritesFile: join(dir, 'fav.json') });
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
  await fetch(`${base}/api/favorites`, { method: 'POST', body: JSON.stringify(a) });
  const list = await (await fetch(`${base}/api/favorites`)).json();
  assert.deepEqual(list.map((x: Asset) => x.id), ['m1']);
  const del = await fetch(`${base}/api/favorites/${encodeURIComponent('m1')}`, { method: 'DELETE' });
  assert.equal(del.status, 200);
  assert.deepEqual(await (await fetch(`${base}/api/favorites`)).json(), []);
});

test('favoritos: cuerpo inválido → 400', async () => {
  const r = await fetch(`${base}/api/favorites`, { method: 'POST', body: '{"nada":1}' });
  assert.equal(r.status, 400);
  const r2 = await fetch(`${base}/api/favorites`, { method: 'POST', body: 'no json' });
  assert.equal(r2.status, 400);
});
