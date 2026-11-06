import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Adapter, Asset, AssetType } from '../../shared/types.ts';
import { createCache } from './cache.ts';
import { runSearch } from './search.ts';

const asset = (over: Partial<Asset> = {}): Asset => ({
  id: 'x1', type: 'sprite', title: 'T', author: 'A', license: 'cc0', licenseUrl: 'https://l',
  thumbnailUrl: null, previewUrl: null, sourceName: 'S', sourceUrl: 'https://s', downloadUrl: null,
  attributionText: 'T de A', ...over,
});

function fake(name: string, impl: () => Promise<Asset[]>, extra: Partial<Adapter> = {}): Adapter & { calls: number } {
  const a = {
    name, types: ['sprite'] as AssetType[], requiresKey: null, calls: 0,
    async search() { a.calls++; return impl(); }, ...extra,
  };
  return a as Adapter & { calls: number };
}

async function opts(env: Record<string, string | undefined> = {}, timeoutMs = 200) {
  const cache = createCache(await mkdtemp(join(tmpdir(), 's-')), 60_000);
  return { cache, env, timeoutMs };
}

test('un adaptador falla y otro responde', async () => {
  const good = fake('Bueno', async () => [asset({ id: 'g' })]);
  const bad = fake('Malo', async () => { throw new Error('boom'); });
  const r = await runSearch([good, bad], 'arbol', 'sprite', await opts());
  assert.deepEqual(r.results.map((x) => x.id), ['g']);
  assert.deepEqual(r.sources.find((s) => s.source === 'Malo'), { source: 'Malo', ok: false, error: 'error' });
  assert.equal(r.sources.find((s) => s.source === 'Bueno')?.ok, true);
});

test('adaptador lento da timeout', async () => {
  const slow = fake('Lento', () => new Promise(() => {}));
  const r = await runSearch([slow], 'x', 'sprite', await opts({}, 30));
  assert.deepEqual(r.sources, [{ source: 'Lento', ok: false, error: 'timeout' }]);
});

test('sin clave en env: sin-configurar y no se llama', async () => {
  const k = fake('ConClave', async () => [asset()], { requiresKey: 'MI_CLAVE' });
  const r = await runSearch([k], 'x', 'sprite', await opts({}));
  assert.equal(k.calls, 0);
  assert.deepEqual(r.sources, [{ source: 'ConClave', ok: false, error: 'sin-configurar' }]);
  const r2 = await runSearch([k], 'x', 'sprite', await opts({ MI_CLAVE: 'abc' }));
  assert.equal(k.calls, 1);
  assert.equal(r2.sources[0].ok, true);
});

test('consulta vacía no llama a nadie', async () => {
  const a = fake('A', async () => [asset()]);
  const r = await runSearch([a], '   ', 'all', await opts());
  assert.deepEqual(r, { results: [], sources: [] });
  assert.equal(a.calls, 0);
});

test('la segunda búsqueda igual sale de la caché', async () => {
  const a = fake('A', async () => [asset()]);
  const o = await opts();
  await runSearch([a], 'Árbol', 'sprite', o);
  await runSearch([a], '  árbol ', 'sprite', o);
  assert.equal(a.calls, 1);
});

test('no se cachean los fallos', async () => {
  let fail = true;
  const a = fake('A', async () => { if (fail) throw new Error('x'); return [asset()]; });
  const o = await opts();
  await runSearch([a], 'q', 'sprite', o);
  fail = false;
  const r = await runSearch([a], 'q', 'sprite', o);
  assert.equal(r.results.length, 1);
});

test('se descartan licencias no permitidas y atribución vacía', async () => {
  const a = fake('A', async () => [
    asset({ id: 'ok' }),
    asset({ id: 'vacia', attributionText: '  ' }),
    asset({ id: 'nc', license: 'cc-nc' as never }),
    asset({ id: 'ofl-sprite', license: 'ofl' }),
  ]);
  const r = await runSearch([a], 'q', 'sprite', await opts());
  assert.deepEqual(r.results.map((x) => x.id), ['ok']);
});

test('ofl y apache-2.0 solo valen para fuentes', async () => {
  const f = fake('F', async () => [asset({ id: 'f1', type: 'font', license: 'ofl' }), asset({ id: 'f2', type: 'font', license: 'apache-2.0' })], { types: ['font'] });
  const r = await runSearch([f], 'roboto', 'font', await opts());
  assert.deepEqual(r.results.map((x) => x.id), ['f1', 'f2']);
});

test("type 'all' consulta cada tipo del adaptador; type concreto omite adaptadores que no lo soportan", async () => {
  const a = fake('A', async () => [asset()], { types: ['sprite', 'audio'] });
  const b = fake('B', async () => [asset({ id: 'b' })], { types: ['font'] });
  await runSearch([a, b], 'q', 'all', await opts());
  assert.equal(a.calls, 2);
  assert.equal(b.calls, 1);
  const r = await runSearch([a, b], 'otra', 'audio', await opts());
  assert.deepEqual(r.sources.map((s) => s.source), ['A']);
});

test('se descartan URLs que no son http(s) (javascript:, data:)', async () => {
  const a = fake('A', async () => [
    asset({ id: 'ok', thumbnailUrl: 'https://t/1.png', downloadUrl: 'https://d' }),
    asset({ id: 'js', sourceUrl: 'javascript:alert(1)' }),
    asset({ id: 'data', thumbnailUrl: 'data:text/html,<script>' }),
    asset({ id: 'prev', previewUrl: 'javascript:void(0)' }),
    asset({ id: 'dl', downloadUrl: 'vbscript:x' }),
    asset({ id: 'lic', licenseUrl: 'javascript:1' }),
  ]);
  const r = await runSearch([a], 'q', 'sprite', await opts());
  assert.deepEqual(r.results.map((x) => x.id), ['ok']);
});
