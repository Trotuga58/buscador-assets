import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Asset } from '../../shared/types.ts';
import { createFavorites } from './favorites.ts';

const a = (id: string): Asset => ({
  id, type: 'audio', title: id, author: 'A', license: 'cc0', licenseUrl: '', thumbnailUrl: null, previewUrl: null,
  sourceName: 'S', sourceUrl: 'https://s', downloadUrl: null, attributionText: 'x',
});
const file = async () => join(await mkdtemp(join(tmpdir(), 'fav-')), 'f.json');

test('archivo inexistente → lista vacía', async () => {
  assert.deepEqual(await createFavorites(await file()).list(), []);
});

test('añadir dos veces el mismo id no duplica', async () => {
  const f = createFavorites(await file());
  await f.add(a('x:1')); await f.add(a('x:1')); await f.add(a('x:2'));
  assert.deepEqual((await f.list()).map((x) => x.id), ['x:1', 'x:2']);
});

test('remove quita solo ese id y no falla si no existe', async () => {
  const f = createFavorites(await file());
  await f.add(a('x:1')); await f.add(a('x:2'));
  await f.remove('x:1'); await f.remove('no-existe');
  assert.deepEqual((await f.list()).map((x) => x.id), ['x:2']);
});

test('archivo corrupto se trata como lista vacía y se puede seguir usando', async () => {
  const p = await file();
  await writeFile(p, '{esto no es json');
  const f = createFavorites(p);
  assert.deepEqual(await f.list(), []);
  await f.add(a('x:1'));
  assert.equal((await f.list()).length, 1);
});

test('el contenido que no es una lista también se trata como vacío', async () => {
  const p = await file();
  await writeFile(p, '{"a":1}');
  assert.deepEqual(await createFavorites(p).list(), []);
});
