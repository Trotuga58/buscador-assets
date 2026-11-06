import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSettings, KEY_NAMES } from './settings.ts';

const file = async () => join(await mkdtemp(join(tmpdir(), 'set-')), 's.json');

test('KEY_NAMES son las cuatro claves conocidas', () => {
  assert.deepEqual([...KEY_NAMES].sort(), ['FREESOUND_API_KEY', 'GOOGLE_FONTS_API_KEY', 'POLYPIZZA_API_KEY', 'SKETCHFAB_API_KEY']);
});

test('update guarda en archivo y en env; status solo dice si está configurada', async () => {
  const env: Record<string, string | undefined> = {};
  const s = createSettings(await file(), env);
  await s.update({ FREESOUND_API_KEY: ' abc ' });
  assert.equal(env.FREESOUND_API_KEY, 'abc');
  assert.deepEqual(s.status(), { FREESOUND_API_KEY: true, GOOGLE_FONTS_API_KEY: false, POLYPIZZA_API_KEY: false, SKETCHFAB_API_KEY: false });
});

test('cadena vacía borra la clave', async () => {
  const env: Record<string, string | undefined> = { FREESOUND_API_KEY: 'x' };
  const s = createSettings(await file(), env);
  await s.update({ FREESOUND_API_KEY: '' });
  assert.equal(env.FREESOUND_API_KEY, undefined);
  assert.equal(s.status().FREESOUND_API_KEY, false);
});

test('ignora nombres que no son claves conocidas (no se puede tocar PATH, etc.)', async () => {
  const env: Record<string, string | undefined> = {};
  const s = createSettings(await file(), env);
  await s.update({ PATH: 'x', NODE_OPTIONS: '--evil' } as never);
  assert.equal(env.PATH, undefined);
  assert.equal(env.NODE_OPTIONS, undefined);
});

test('load lee el archivo al arrancar; archivo corrupto no rompe', async () => {
  const f = await file();
  const a: Record<string, string | undefined> = {};
  await createSettings(f, a).update({ POLYPIZZA_API_KEY: 'k1' });
  const b: Record<string, string | undefined> = {};
  await createSettings(f, b).load();
  assert.equal(b.POLYPIZZA_API_KEY, 'k1');
  await writeFile(f, 'no json');
  const c: Record<string, string | undefined> = {};
  await createSettings(f, c).load();
  assert.deepEqual(c, {});
  assert.ok((await readFile(f, 'utf8')).length > 0);
});

test('una clave del entorno (.env) no se pierde si el archivo no la menciona', async () => {
  const env: Record<string, string | undefined> = { SKETCHFAB_API_KEY: 'del-env' };
  const s = createSettings(await file(), env);
  await s.load();
  assert.equal(env.SKETCHFAB_API_KEY, 'del-env');
});
