import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCache } from './cache.ts';

const tmp = () => mkdtemp(join(tmpdir(), 'cache-'));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test('set y luego get devuelve el valor', async () => {
  const c = createCache(await tmp(), 60_000);
  await c.set('a', { x: 1 });
  assert.deepEqual(await c.get('a'), { x: 1 });
});

test('get de clave inexistente devuelve null', async () => {
  const c = createCache(await tmp(), 60_000);
  assert.equal(await c.get('nada'), null);
});

test('entrada caducada devuelve null', async () => {
  const c = createCache(await tmp(), 10);
  await c.set('a', 1);
  await sleep(40);
  assert.equal(await c.get('a'), null);
});

test('clave con caracteres raros no rompe', async () => {
  const c = createCache(await tmp(), 60_000);
  const key = '../../etc/pass wd|ñ/?*:"<>';
  await c.set(key, 'ok');
  assert.equal(await c.get(key), 'ok');
});
