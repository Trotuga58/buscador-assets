import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFreesoundAdapter } from './freesound.ts';

const fx = JSON.parse(readFileSync(new URL('./__fixtures__/freesound.json', import.meta.url), 'utf8'));
const sig = new AbortController().signal;
function mk() {
  const calls: Array<{ url: string; headers: Record<string, string> }> = [];
  const f = (async (url: string, init: RequestInit) => {
    calls.push({ url, headers: init.headers as Record<string, string> });
    return new Response(JSON.stringify(fx), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, calls };
}

test('mapea sonidos libres; descarta NC y sampling+', async () => {
  const { f } = mk();
  const out = await createFreesoundAdapter(f, () => 'K').search('rain', 'audio', sig);
  assert.deepEqual(out.map((a) => a.id), ['freesound:101', 'freesound:102']);
  assert.equal(out[0].type, 'audio');
  assert.equal(out[0].license, 'cc0');
  assert.equal(out[0].author, 'sam');
  assert.equal(out[0].previewUrl, 'https://cdn.freesound.org/previews/101_hq.mp3');
  assert.equal(out[0].thumbnailUrl, 'https://cdn.freesound.org/displays/101_m.png');
  assert.equal(out[0].sourceUrl, 'https://freesound.org/people/sam/sounds/101/');
});

test('la descarga exige cuenta: downloadUrl null', async () => {
  const { f } = mk();
  const out = await createFreesoundAdapter(f, () => 'K').search('rain', 'audio', sig);
  assert.ok(out.every((a) => a.downloadUrl === null));
});

test('campos vacíos → reservas y null', async () => {
  const { f } = mk();
  const b = (await createFreesoundAdapter(f, () => 'K').search('rain', 'audio', sig))[1];
  assert.equal(b.title, 'Sin título');
  assert.equal(b.author, 'Desconocido');
  assert.equal(b.previewUrl, null);
  assert.equal(b.thumbnailUrl, null);
  assert.equal(b.license, 'cc-by');
});

test('filtra por licencia en la consulta y envía el token', async () => {
  const { f, calls } = mk();
  await createFreesoundAdapter(f, () => 'TOK').search('rain', 'audio', sig);
  const u = decodeURIComponent(calls[0].url.replace(/\+/g, ' '));
  assert.ok(u.includes('Creative Commons 0') && u.includes('Attribution'));
  assert.ok(u.includes('query=rain'));
  assert.equal(calls[0].headers['authorization'], 'Token TOK');
});

test('otro tipo → vacío sin llamar', async () => {
  const { f, calls } = mk();
  assert.deepEqual(await createFreesoundAdapter(f, () => 'K').search('x', 'sprite', sig), []);
  assert.equal(calls.length, 0);
});
