import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import type { Asset } from '../../shared/types.ts';
import { downloadAsset } from './downloads.ts';

const asset = (o: Partial<Asset> = {}): Asset => ({
  id: 'pp:1', type: 'model3d', title: 'Espada Épica', author: 'Ana', license: 'cc0', licenseUrl: 'https://l/cc0',
  thumbnailUrl: null, previewUrl: null, sourceName: 'Poly Pizza', sourceUrl: 'https://s/1', downloadUrl: 'https://d.example/m/espada.glb',
  attributionText: '"Espada" de Ana (CC0)', ...o,
});
const bytes = new Uint8Array([1, 2, 3]);
const ok = (async () => new Response(bytes, { headers: { 'content-length': '3' } })) as unknown as typeof fetch;

test('descarga el archivo y deja LICENCIA.txt al lado', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dl-'));
  const r = await downloadAsset(asset(), dir, { fetchFn: ok });
  assert.ok(r.file.endsWith('espada.glb') && r.file.startsWith(dir + sep));
  assert.deepEqual(new Uint8Array(await readFile(r.file)), bytes);
  assert.equal(r.bytes, 3);
  const lic = await readFile(join(r.folder, 'LICENCIA.txt'), 'utf8');
  for (const part of ['"Espada" de Ana (CC0)', 'CC0', 'https://l/cc0', 'https://s/1']) assert.ok(lic.includes(part), part);
});

test('rechaza lo que no se puede descargar con seguridad', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dl-'));
  await assert.rejects(downloadAsset(asset({ downloadUrl: null }), dir, { fetchFn: ok }), /descarga directa/);
  await assert.rejects(downloadAsset(asset({ downloadUrl: 'file:///etc/passwd' }), dir, { fetchFn: ok }), /no es un asset permitido/i);
  await assert.rejects(downloadAsset(asset({ license: 'cc-by' }), dir, { fetchFn: ok }), /no es un asset permitido/i);
  await assert.rejects(downloadAsset(asset({ license: 'cc-by-nc' as never }), dir, { fetchFn: ok }), /no es un asset permitido/i);
  await assert.rejects(downloadAsset(asset(), dir, { fetchFn: (async () => new Response('x', { status: 404 })) as unknown as typeof fetch }), /404/);
});

test('límite de tamaño: por cabecera y por contenido real', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dl-'));
  await assert.rejects(downloadAsset(asset(), dir, { fetchFn: ok, maxBytes: 2 }), /demasiado grande/);
  const sinCabecera = (async () => new Response(bytes)) as unknown as typeof fetch;
  await assert.rejects(downloadAsset(asset(), dir, { fetchFn: sinCabecera, maxBytes: 2 }), /demasiado grande/);
});

test('el nombre de archivo no puede salirse de la carpeta', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dl-'));
  const r = await downloadAsset(asset({ downloadUrl: 'https://d.example/a/..%2F..%2Fevil.glb' }), dir, { fetchFn: ok });
  assert.ok(r.file.startsWith(r.folder + sep));
  assert.ok(!r.file.slice(r.folder.length).includes('..'));
});

test('sin extensión usa el tipo de contenido', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'dl-'));
  const f = (async () => new Response(bytes, { headers: { 'content-type': 'model/gltf-binary' } })) as unknown as typeof fetch;
  const r = await downloadAsset(asset({ downloadUrl: 'https://d.example/descarga' }), dir, { fetchFn: f });
  assert.ok(r.file.endsWith('.glb'));
});
