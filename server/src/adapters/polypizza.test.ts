import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createPolyPizzaAdapter } from './polypizza.ts';

const fx = JSON.parse(readFileSync(new URL('./__fixtures__/polypizza.json', import.meta.url), 'utf8'));
const sig = new AbortController().signal;
function mk() {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string> });
    return new Response(JSON.stringify(fx), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}

test('mapea modelos a model3d con .glb y descarta todo lo que no sea CC0 (CC BY, NC, sin licencia)', async () => {
  const { f } = mk();
  const out = await createPolyPizzaAdapter(f, () => 'K').search('tree', 'model3d', sig);
  assert.deepEqual(out.map((a) => a.id), ['polypizza:abc1', 'polypizza:abc2']);
  assert.equal(out[0].type, 'model3d');
  assert.equal(out[0].license, 'cc0');
  assert.equal(out[0].previewUrl, 'https://static.poly.pizza/abc1.glb');
  assert.equal(out[0].downloadUrl, 'https://static.poly.pizza/abc1.glb');
  assert.equal(out[0].sourceUrl, 'https://poly.pizza/m/abc1');
});

test('campos vacíos usan valores de reserva y null', async () => {
  const { f } = mk();
  const b = (await createPolyPizzaAdapter(f, () => 'K').search('tree', 'model3d', sig))[1];
  assert.equal(b.license, 'cc0');
  assert.equal(b.title, 'Sin título');
  assert.equal(b.author, 'Desconocido');
  assert.equal(b.thumbnailUrl, null);
  assert.equal(b.previewUrl, null);
  assert.equal(b.downloadUrl, null);
});

test('envía la clave en x-auth-token y la palabra en la ruta', async () => {
  const { f, calls } = mk();
  await createPolyPizzaAdapter(f, () => 'MI-CLAVE').search('low poly', 'model3d', sig);
  assert.equal(calls[0].headers['x-auth-token'], 'MI-CLAVE');
  assert.match(calls[0].url, /\/search\/low%20poly/);
});

test('otro tipo → lista vacía sin llamar', async () => {
  const { f, calls } = mk();
  assert.deepEqual(await createPolyPizzaAdapter(f, () => 'K').search('x', 'audio', sig), []);
  assert.equal(calls.length, 0);
});
