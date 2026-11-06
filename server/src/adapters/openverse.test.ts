import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createOpenverseAdapter } from './openverse.ts';

const fx = JSON.parse(readFileSync(new URL('./__fixtures__/openverse-audio.json', import.meta.url), 'utf8'));
const sig = new AbortController().signal;

function fakeFetch() {
  const urls: string[] = [];
  const f = (async (url: string) => { urls.push(url); return new Response(JSON.stringify(fx), { status: 200 }); }) as unknown as typeof fetch;
  return { f, urls };
}

test('solo audio: mapea y descarta by-sa y by-nc', async () => {
  const { f } = fakeFetch();
  const out = await createOpenverseAdapter(f).search('calm', 'audio', sig);
  assert.deepEqual(out.map((a) => a.id), ['openverse:aud1', 'openverse:aud2']);
  assert.equal(out[0].type, 'audio');
  assert.equal(out[0].license, 'cc0');
  assert.equal(out[0].previewUrl, 'https://cdn.example/loop.mp3');
  assert.equal(out[0].sourceUrl, 'https://example.org/loop');
});

test('título vacío → Sin título; autor ausente → Desconocido; miniatura ausente → null', async () => {
  const { f } = fakeFetch();
  const b = (await createOpenverseAdapter(f).search('x', 'audio', sig))[1];
  assert.equal(b.title, 'Sin título');
  assert.equal(b.author, 'Desconocido');
  assert.equal(b.thumbnailUrl, null);
});

test('otros tipos (sprite) no se consultan', async () => {
  const { f, urls } = fakeFetch();
  assert.deepEqual(await createOpenverseAdapter(f).search('tree', 'sprite', sig), []);
  assert.equal(urls.length, 0);
});

test('pide solo licencias cc0 y by, en el endpoint de audio', async () => {
  const { f, urls } = fakeFetch();
  await createOpenverseAdapter(f).search('tree', 'audio', sig);
  assert.match(urls[0], /\/audio\//);
  assert.match(urls[0], /license=cc0(%2C|,)by/);
});

test('HTTP de error lanza', async () => {
  const f = (async () => new Response('x', { status: 429 })) as unknown as typeof fetch;
  await assert.rejects(createOpenverseAdapter(f).search('x', 'audio', sig), /429/);
});
