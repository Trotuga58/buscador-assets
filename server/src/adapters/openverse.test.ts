import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createOpenverseAdapter } from './openverse.ts';

const fx = (n: string) => JSON.parse(readFileSync(new URL(`./__fixtures__/${n}.json`, import.meta.url), 'utf8'));
const sig = new AbortController().signal;

function fakeFetch(map: Record<string, unknown>) {
  const urls: string[] = [];
  const f = (async (url: string) => {
    urls.push(url);
    const key = Object.keys(map).find((k) => url.includes(k))!;
    return new Response(JSON.stringify(map[key]), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, urls };
}

test('imágenes → sprite, descarta by-sa y by-nc', async () => {
  const { f } = fakeFetch({ '/images/': fx('openverse-images') });
  const out = await createOpenverseAdapter(f).search('tree', 'sprite', sig);
  assert.deepEqual(out.map((a) => a.id), ['openverse:img1', 'openverse:img2']);
  assert.equal(out[0].type, 'sprite');
  assert.equal(out[0].license, 'cc0');
  assert.equal(out[0].licenseUrl, 'https://creativecommons.org/publicdomain/zero/1.0/');
  assert.equal(out[0].sourceUrl, 'https://example.org/tree');
  assert.equal(out[0].previewUrl, 'https://cdn.example/tree.png');
});

test('título vacío → Sin título; autor ausente → Desconocido; miniatura ausente → null', async () => {
  const { f } = fakeFetch({ '/images/': fx('openverse-images') });
  const b = (await createOpenverseAdapter(f).search('x', 'sprite', sig))[1];
  assert.equal(b.title, 'Sin título');
  assert.equal(b.author, 'Desconocido');
  assert.equal(b.thumbnailUrl, null);
  assert.ok(b.attributionText.includes('Desconocido'));
});

test('audio → type audio con previewUrl', async () => {
  const { f } = fakeFetch({ '/audio/': fx('openverse-audio') });
  const out = await createOpenverseAdapter(f).search('calm', 'audio', sig);
  assert.equal(out[0].type, 'audio');
  assert.equal(out[0].previewUrl, 'https://cdn.example/loop.mp3');
});

test('pide solo licencias cc0 y by', async () => {
  const { f, urls } = fakeFetch({ '/images/': fx('openverse-images') });
  await createOpenverseAdapter(f).search('tree', 'sprite', sig);
  assert.match(urls[0], /license=cc0(%2C|,)by/);
  assert.match(urls[0], /q=tree/);
});

test('HTTP de error lanza', async () => {
  const f = (async () => new Response('x', { status: 429 })) as unknown as typeof fetch;
  await assert.rejects(createOpenverseAdapter(f).search('x', 'sprite', sig), /429/);
});
