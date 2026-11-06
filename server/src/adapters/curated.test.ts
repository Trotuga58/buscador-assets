import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createCuratedAdapter, type CuratedEntry } from './curated.ts';

const sig = new AbortController().signal;
const data: CuratedEntry[] = [
  { title: 'Pack Cañón', author: 'Kenney', type: 'sprite', license: 'CC0 1.0', licenseUrl: 'https://l0', url: 'https://k/1', tags: ['plataformas', '2D'] },
  { title: 'Sonidos UI', author: 'Kenney', type: 'audio', license: 'cc0', licenseUrl: 'https://l0', url: 'https://k/2', tags: ['interfaz'] },
  { title: 'Con NC', author: 'X', type: 'sprite', license: 'CC BY-NC 4.0', licenseUrl: 'https://l', url: 'https://k/3', tags: ['plataformas'] },
];

test('busca por título y etiqueta sin mayúsculas ni tildes', async () => {
  const a = createCuratedAdapter(data);
  assert.deepEqual((await a.search('CANON', 'sprite', sig)).map((x) => x.title), ['Pack Cañón']);
  assert.deepEqual((await a.search('plataformas', 'sprite', sig)).map((x) => x.title), ['Pack Cañón']);
});

test('filtra por tipo', async () => {
  const a = createCuratedAdapter(data);
  assert.deepEqual((await a.search('kenney', 'audio', sig)).map((x) => x.title), ['Sonidos UI']);
});

test('descarta al cargar las entradas con licencia no válida', async () => {
  const a = createCuratedAdapter(data);
  assert.ok(!(await a.search('con nc', 'sprite', sig)).length);
});

test('todas las palabras de la consulta deben coincidir', async () => {
  const a = createCuratedAdapter(data);
  assert.equal((await a.search('kenney plataformas', 'sprite', sig)).length, 1);
  assert.equal((await a.search('kenney inexistente', 'sprite', sig)).length, 0);
});

test('resultado: enlace a la fuente, sin descarga directa, atribución', async () => {
  const x = (await createCuratedAdapter(data).search('canon', 'sprite', sig))[0];
  assert.equal(x.sourceUrl, 'https://k/1');
  assert.equal(x.downloadUrl, null);
  assert.equal(x.license, 'cc0');
  assert.ok(x.attributionText.includes('Kenney'));
});

test('curated.json real: ≥10 entradas y todas con licencia válida', () => {
  const real = JSON.parse(readFileSync(new URL('../../data/curated.json', import.meta.url), 'utf8')) as CuratedEntry[];
  assert.ok(real.length >= 10);
  const a = createCuratedAdapter(real);
  return Promise.all(['sprite', 'model3d', 'audio'].map(async (t) => {
    const found = await a.search('kenney', t as 'sprite', sig);
    assert.ok(found.length >= 0);
  })).then(async () => {
    const total = (await Promise.all(['sprite', 'model3d', 'audio', 'code'].map((t) => a.search('', t as 'sprite', sig)))).flat();
    assert.equal(total.length, real.length);
  });
});
